import { Command } from '@langchain/langgraph';
import type { Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const invokeMock = vi.fn();
const getStateMock = vi.fn();

vi.mock('@/server/graph/index.js', () => ({
  receiptGraph: {
    invoke: (...args: unknown[]) => invokeMock(...args),
    getState: (...args: unknown[]) => getStateMock(...args),
  },
  buildReceiptWorkflow: vi.fn(),
  getReceiptGraph: vi.fn(),
  getCheckpointer: vi.fn(),
}));

vi.mock('@/server/telegram/send.js', () => ({
  sendToSender: vi.fn().mockResolvedValue(undefined),
  sendToReceiver: vi.fn().mockResolvedValue(undefined),
  answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
  getFileUrl: vi.fn(async (id: string) => `https://file/${id}.jpg`),
  sendMessage: vi.fn(),
}));

function mockRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

describe('telegram webhook', () => {
  let handleTelegramWebhook: typeof import('./webhook.js').handleTelegramWebhook;
  let sendMocks: typeof import('./send.js');

  beforeEach(async () => {
    vi.resetModules();
    invokeMock.mockReset();
    getStateMock.mockReset();
    getStateMock.mockResolvedValue({ next: [], tasks: [] });
    invokeMock.mockResolvedValue({});
    ({ handleTelegramWebhook } = await import('./webhook.js'));
    sendMocks = await import('./send.js');
    vi.mocked(sendMocks.sendToSender).mockClear();
    vi.mocked(sendMocks.answerCallbackQuery).mockClear();
  });
  afterEach(() => vi.clearAllMocks());

  it('responds 200 immediately and ignores updates with no message or callback', async () => {
    const req = { body: { update_id: 1 } } as Request;
    const res = mockRes();
    await handleTelegramWebhook(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('ignores messages from unauthorized chat ids', async () => {
    const req = {
      body: {
        update_id: 1,
        message: {
          message_id: 1,
          chat: { id: 999, type: 'private' }, // not 111 or 222
          text: 'hi',
        },
      },
    } as Request;
    const res = mockRes();
    await handleTelegramWebhook(req, res);
    // Let async processing settle
    await new Promise((r) => setTimeout(r, 10));
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('starts a fresh graph thread on first photo from authorized chat', async () => {
    const req = {
      body: {
        update_id: 1,
        message: {
          message_id: 1,
          chat: { id: 111, type: 'private' }, // senderChatId from test/setup.ts
          photo: [{ file_id: 'small', file_unique_id: 's', width: 10, height: 10 }],
          caption: 'kroger run',
        },
      },
    } as Request;
    await handleTelegramWebhook(req, mockRes());
    await new Promise((r) => setTimeout(r, 10));

    expect(invokeMock).toHaveBeenCalledTimes(1);
    const [input, cfg] = invokeMock.mock.calls[0];
    expect(input).toMatchObject({
      channel: 'telegram',
      chatId: '111',
      pendingImages: ['https://file/small.jpg'],
      userGuidance: 'kroger run',
    });
    expect(cfg).toMatchObject({ configurable: { thread_id: 'tg:111' } });
  });

  it('resumes active thread with addImages when photo arrives mid-collection', async () => {
    getStateMock.mockResolvedValue({
      next: ['collectImages'],
      tasks: [{ interrupts: [{ value: { type: 'collect_images', imageCount: 1 } }] }],
    });

    const req = {
      body: {
        update_id: 2,
        message: {
          message_id: 2,
          chat: { id: 111, type: 'private' },
          photo: [{ file_id: 'f2', file_unique_id: 'f2', width: 10, height: 10 }],
        },
      },
    } as Request;
    await handleTelegramWebhook(req, mockRes());
    await new Promise((r) => setTimeout(r, 10));

    expect(invokeMock).toHaveBeenCalledTimes(1);
    const [cmd] = invokeMock.mock.calls[0];
    expect(cmd).toBeInstanceOf(Command);
    expect((cmd as Command).resume).toEqual({
      addImages: ['https://file/f2.jpg'],
      guidance: undefined,
    });
  });

  it('callback_query "collect:done" resumes graph with {done:true}', async () => {
    const req = {
      body: {
        update_id: 3,
        callback_query: {
          id: 'cb-1',
          from: { id: 111, first_name: 'Tester' },
          message: { message_id: 1, chat: { id: 111, type: 'private' } },
          data: 'collect:done',
        },
      },
    } as Request;
    await handleTelegramWebhook(req, mockRes());
    await new Promise((r) => setTimeout(r, 10));

    expect(sendMocks.answerCallbackQuery).toHaveBeenCalledWith('cb-1');
    const [cmd] = invokeMock.mock.calls[0];
    expect(cmd).toBeInstanceOf(Command);
    expect((cmd as Command).resume).toEqual({ done: true });
  });

  it('callback_query "confirm:approve" resumes graph with decision=approve', async () => {
    const req = {
      body: {
        update_id: 4,
        callback_query: {
          id: 'cb-2',
          from: { id: 111, first_name: 'Tester' },
          message: { message_id: 1, chat: { id: 111, type: 'private' } },
          data: 'confirm:approve',
        },
      },
    } as Request;
    await handleTelegramWebhook(req, mockRes());
    await new Promise((r) => setTimeout(r, 10));

    const [cmd] = invokeMock.mock.calls[0];
    expect((cmd as Command).resume).toEqual({ decision: 'approve' });
  });

  it('callback_query "confirm:reject" resumes graph with decision=reject and messages the user', async () => {
    const req = {
      body: {
        update_id: 5,
        callback_query: {
          id: 'cb-3',
          from: { id: 111, first_name: 'Tester' },
          message: { message_id: 1, chat: { id: 111, type: 'private' } },
          data: 'confirm:reject',
        },
      },
    } as Request;
    await handleTelegramWebhook(req, mockRes());
    await new Promise((r) => setTimeout(r, 10));

    const [cmd] = invokeMock.mock.calls[0];
    expect((cmd as Command).resume).toEqual({ decision: 'reject' });
    expect(sendMocks.sendToSender).toHaveBeenCalledWith('111', expect.stringMatching(/Rejected/i));
  });

  it('callback_query "confirm:edit" prompts the user without resuming the graph', async () => {
    const req = {
      body: {
        update_id: 6,
        callback_query: {
          id: 'cb-4',
          from: { id: 111, first_name: 'Tester' },
          message: { message_id: 1, chat: { id: 111, type: 'private' } },
          data: 'confirm:edit',
        },
      },
    } as Request;
    await handleTelegramWebhook(req, mockRes());
    await new Promise((r) => setTimeout(r, 10));

    expect(invokeMock).not.toHaveBeenCalled();
    expect(sendMocks.sendToSender).toHaveBeenCalledWith(
      '111',
      expect.stringMatching(/correction/i)
    );
  });

  it('free text during confirm_receipt interrupt is treated as edit corrections', async () => {
    getStateMock.mockResolvedValue({
      next: ['awaitConfirmation'],
      tasks: [{ interrupts: [{ value: { type: 'confirm_receipt' } }] }],
    });
    const req = {
      body: {
        update_id: 7,
        message: {
          message_id: 7,
          chat: { id: 111, type: 'private' },
          text: 'combine items 2 and 3',
        },
      },
    } as Request;
    await handleTelegramWebhook(req, mockRes());
    await new Promise((r) => setTimeout(r, 10));

    const [cmd] = invokeMock.mock.calls[0];
    expect((cmd as Command).resume).toEqual({
      decision: 'edit',
      corrections: 'combine items 2 and 3',
    });
  });
});
