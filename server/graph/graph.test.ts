import { Command, MemorySaver } from '@langchain/langgraph';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ParsedReceipt } from '@/server/state/conversation.js';

const invokeMock = vi.fn();

vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn().mockImplementation(() => ({
    withStructuredOutput: () => ({ invoke: (...args: unknown[]) => invokeMock(...args) }),
  })),
}));

vi.mock('@/server/telegram/send.js', () => ({
  sendToReceiver: vi.fn().mockResolvedValue(undefined),
  sendToSender: vi.fn().mockResolvedValue(undefined),
  getFileUrl: vi.fn(),
  answerCallbackQuery: vi.fn(),
  sendMessage: vi.fn(),
}));

const parsed: ParsedReceipt = {
  storeName: 'HEB',
  date: '11/26/25',
  missingStoreName: false,
  missingDate: false,
  originalTotal: 1000,
  hasUnclearItems: false,
  hasMissingItems: false,
  categories: {
    groceries: { items: [], subtotal: 1000, fees: 0, tax: 0, total: 1000 },
  } as unknown as ParsedReceipt['categories'],
};

describe('receipt graph (integration, MemorySaver)', () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  async function freshGraph() {
    const { buildReceiptWorkflow } = await import('@/server/graph/index.js');
    return buildReceiptWorkflow().compile({ checkpointer: new MemorySaver() });
  }

  const cfg = { configurable: { thread_id: 'test-1' } };

  it('interrupts at collect_images on fresh telegram thread and resumes on done', async () => {
    invokeMock.mockResolvedValue(parsed);
    const graph = await freshGraph();

    await graph.invoke(
      {
        channel: 'telegram',
        chatId: '111',
        pendingImages: ['https://img/1.jpg'],
      },
      cfg
    );

    let snapshot = await graph.getState(cfg);
    let interrupts = (snapshot.tasks ?? []).flatMap((t) => t.interrupts ?? []);
    expect(interrupts).toHaveLength(1);
    expect((interrupts[0].value as { type: string }).type).toBe('collect_images');

    await graph.invoke(new Command({ resume: { done: true } }), cfg);

    // Now should be paused at confirm_receipt
    snapshot = await graph.getState(cfg);
    interrupts = (snapshot.tasks ?? []).flatMap((t) => t.interrupts ?? []);
    expect(interrupts).toHaveLength(1);
    const value = interrupts[0].value as { type: string; parsedReceipt: ParsedReceipt };
    expect(value.type).toBe('confirm_receipt');
    expect(value.parsedReceipt.storeName).toBe('HEB');

    // Parser was invoked exactly once (after done)
    expect(invokeMock).toHaveBeenCalledTimes(1);
  });

  it('keeps interrupting while images are being added, then proceeds on done', async () => {
    invokeMock.mockResolvedValue(parsed);
    const graph = await freshGraph();
    const cfg2 = { configurable: { thread_id: 'test-add-many' } };

    await graph.invoke({ channel: 'telegram', chatId: '111', pendingImages: ['u1'] }, cfg2);
    await graph.invoke(new Command({ resume: { addImages: ['u2', 'u3'] } }), cfg2);
    await graph.invoke(new Command({ resume: { addImages: ['u4'] } }), cfg2);

    let snapshot = await graph.getState(cfg2);
    let interrupts = (snapshot.tasks ?? []).flatMap((t) => t.interrupts ?? []);
    expect((interrupts[0].value as { imageCount: number }).imageCount).toBe(4);

    await graph.invoke(new Command({ resume: { done: true } }), cfg2);

    snapshot = await graph.getState(cfg2);
    interrupts = (snapshot.tasks ?? []).flatMap((t) => t.interrupts ?? []);
    expect((interrupts[0].value as { type: string }).type).toBe('confirm_receipt');

    // Parser was called once, with 4 images in state
    expect(invokeMock).toHaveBeenCalledTimes(1);
    expect(snapshot.values.pendingImages).toEqual(['u1', 'u2', 'u3', 'u4']);
  });

  it('skips collectImages for web channel (all images arrive at once)', async () => {
    invokeMock.mockResolvedValue(parsed);
    const graph = await freshGraph();
    const cfg2 = { configurable: { thread_id: 'test-web' } };

    await graph.invoke({ channel: 'web', chatId: null, pendingImages: ['u1', 'u2'] }, cfg2);

    const snapshot = await graph.getState(cfg2);
    const interrupts = (snapshot.tasks ?? []).flatMap((t) => t.interrupts ?? []);
    expect(interrupts).toHaveLength(1);
    expect((interrupts[0].value as { type: string }).type).toBe('confirm_receipt');
  });

  it('approve decision runs the send node and completes the graph', async () => {
    invokeMock.mockResolvedValue(parsed);
    const { sendToReceiver } = await import('@/server/telegram/send.js');
    const graph = await freshGraph();
    const cfg2 = { configurable: { thread_id: 'test-approve' } };

    await graph.invoke({ channel: 'web', pendingImages: ['u1'] }, cfg2);
    await graph.invoke(new Command({ resume: { decision: 'approve' } }), cfg2);

    const snapshot = await graph.getState(cfg2);
    expect(snapshot.next).toEqual([]); // graph finished
    expect(sendToReceiver).toHaveBeenCalledTimes(1);
  });

  it('edit decision re-runs parseReceipt with merged corrections', async () => {
    invokeMock.mockResolvedValue(parsed);
    const graph = await freshGraph();
    const cfg2 = { configurable: { thread_id: 'test-edit' } };

    await graph.invoke({ channel: 'web', pendingImages: ['u1'] }, cfg2);
    expect(invokeMock).toHaveBeenCalledTimes(1);

    await graph.invoke(
      new Command({ resume: { decision: 'edit', corrections: 'combine items 2 and 3' } }),
      cfg2
    );

    // parseReceipt ran a second time after edit
    expect(invokeMock).toHaveBeenCalledTimes(2);
    const snapshot = await graph.getState(cfg2);
    expect(snapshot.values.userGuidance).toMatch(/combine items 2 and 3/);
    // Paused again at confirm_receipt for the updated parse
    const interrupts = (snapshot.tasks ?? []).flatMap((t) => t.interrupts ?? []);
    expect((interrupts[0].value as { type: string }).type).toBe('confirm_receipt');
  });

  it('reject decision ends without calling sendToReceiver', async () => {
    invokeMock.mockResolvedValue(parsed);
    const { sendToReceiver } = await import('@/server/telegram/send.js');
    vi.mocked(sendToReceiver).mockClear();
    const graph = await freshGraph();
    const cfg2 = { configurable: { thread_id: 'test-reject' } };

    await graph.invoke({ channel: 'web', pendingImages: ['u1'] }, cfg2);
    await graph.invoke(new Command({ resume: { decision: 'reject' } }), cfg2);

    const snapshot = await graph.getState(cfg2);
    expect(snapshot.next).toEqual([]);
    expect(sendToReceiver).not.toHaveBeenCalled();
  });
});
