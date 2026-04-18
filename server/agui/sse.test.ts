import { EventType } from '@ag-ui/core';
import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Minimal async generator for streamEvents mock
async function* emptyStream() {
  // no events
}

async function* withEvents(events: Array<{ event: string; name?: string; data?: unknown }>) {
  for (const e of events) yield e as never;
}

const streamEventsMock = vi.fn();
const getStateMock = vi.fn();

vi.mock('@/server/graph/index.js', () => ({
  receiptGraph: {
    streamEvents: (...args: unknown[]) => streamEventsMock(...args),
    getState: (...args: unknown[]) => getStateMock(...args),
  },
  buildReceiptWorkflow: vi.fn(),
  getReceiptGraph: vi.fn(),
  getCheckpointer: vi.fn(),
}));

function mockRes() {
  const chunks: string[] = [];
  const res = {
    writeHead: vi.fn(),
    write: vi.fn((chunk: string) => {
      chunks.push(chunk);
      return true;
    }),
    end: vi.fn(),
  };
  return { res: res as unknown as Response, chunks };
}

function decodeSse(chunks: string[]): Array<Record<string, unknown>> {
  return chunks
    .map((c) => c.trim())
    .filter((c) => c.startsWith('data:'))
    .map((c) => JSON.parse(c.slice('data:'.length).trim()));
}

describe('agui SSE bridge', () => {
  let handleAguiRun: typeof import('./sse.js').handleAguiRun;
  beforeEach(async () => {
    vi.resetModules();
    streamEventsMock.mockReset();
    getStateMock.mockReset();
    ({ handleAguiRun } = await import('./sse.js'));
  });

  it('writes text/event-stream headers and wraps a run with RUN_STARTED/RUN_FINISHED', async () => {
    streamEventsMock.mockReturnValue(emptyStream());
    getStateMock.mockResolvedValue({ tasks: [] });
    const { res, chunks } = mockRes();
    const req = { body: { input: { channel: 'web' } } } as Request;

    await handleAguiRun(req, res);

    expect(res.writeHead).toHaveBeenCalledWith(
      200,
      expect.objectContaining({
        'Content-Type': 'text/event-stream',
      })
    );
    const events = decodeSse(chunks);
    expect(events[0]).toMatchObject({ type: EventType.RUN_STARTED });
    expect(events.at(-1)).toMatchObject({ type: EventType.RUN_FINISHED });
  });

  it('maps on_chain_start/end → STEP_STARTED/STEP_FINISHED', async () => {
    streamEventsMock.mockReturnValue(
      withEvents([
        { event: 'on_chain_start', name: 'parseReceipt' },
        { event: 'on_chain_end', name: 'parseReceipt' },
      ])
    );
    getStateMock.mockResolvedValue({ tasks: [] });
    const { res, chunks } = mockRes();
    await handleAguiRun({ body: {} } as Request, res);
    const events = decodeSse(chunks);
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: EventType.STEP_STARTED, stepName: 'parseReceipt' }),
        expect.objectContaining({ type: EventType.STEP_FINISHED, stepName: 'parseReceipt' }),
      ])
    );
  });

  it('surfaces pending interrupts as TOOL_CALL_START/ARGS/END', async () => {
    streamEventsMock.mockReturnValue(emptyStream());
    getStateMock.mockResolvedValue({
      tasks: [
        {
          interrupts: [{ value: { type: 'confirm_receipt', parsedReceipt: { foo: 1 } } }],
        },
      ],
    });
    const { res, chunks } = mockRes();
    await handleAguiRun({ body: {} } as Request, res);
    const events = decodeSse(chunks);
    const start = events.find((e) => e.type === EventType.TOOL_CALL_START);
    const args = events.find((e) => e.type === EventType.TOOL_CALL_ARGS);
    const end = events.find((e) => e.type === EventType.TOOL_CALL_END);
    expect(start).toMatchObject({ toolCallName: 'confirm_receipt' });
    expect(args).toBeDefined();
    expect(end).toBeDefined();
    const parsedArgs = JSON.parse(args!.delta as string);
    expect(parsedArgs.type).toBe('confirm_receipt');
  });

  it('emits RUN_ERROR when streamEvents throws', async () => {
    streamEventsMock.mockReturnValue(
      (async function* () {
        if (Math.random() < -1) yield {}; // unreachable — satisfies require-yield
        throw new Error('boom');
      })()
    );
    getStateMock.mockResolvedValue({ tasks: [] });
    const { res, chunks } = mockRes();
    await handleAguiRun({ body: {} } as Request, res);
    const events = decodeSse(chunks);
    expect(events.some((e) => e.type === EventType.RUN_ERROR)).toBe(true);
  });
});
