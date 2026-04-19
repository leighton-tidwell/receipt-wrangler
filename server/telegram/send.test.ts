import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { answerCallbackQuery, sendMessage, sendToReceiver } from '@/server/telegram/send.js';

describe('telegram/send', () => {
  const originalFetch = global.fetch;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => '' });
    global.fetch = fetchMock as unknown as typeof fetch;
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('sends a plain-text message without reply_markup', async () => {
    await sendMessage('123', 'hello');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.chat_id).toBe('123');
    expect(body.text).toBe('hello');
    expect(body.parse_mode).toBe('HTML');
    expect(body.reply_markup).toBeUndefined();
  });

  it('attaches inline_keyboard when buttons are provided', async () => {
    await sendMessage('123', 'pick', [
      [
        { text: 'Done ✅', callback_data: 'collect:done' },
        { text: 'Cancel ❌', callback_data: 'collect:cancel' },
      ],
    ]);
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.reply_markup).toEqual({
      inline_keyboard: [
        [
          { text: 'Done ✅', callback_data: 'collect:done' },
          { text: 'Cancel ❌', callback_data: 'collect:cancel' },
        ],
      ],
    });
  });

  it('throws on non-OK Telegram response', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 400, text: async () => 'bad' });
    await expect(sendMessage('123', 'oops')).rejects.toThrow(/Telegram API error: 400/);
  });

  it('answerCallbackQuery posts to the correct endpoint with the id', async () => {
    await answerCallbackQuery('cb-1', 'ack');
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/answerCallbackQuery$/);
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toEqual({ callback_query_id: 'cb-1', text: 'ack' });
  });

  it('sendToReceiver targets the configured receiver chat id', async () => {
    await sendToReceiver('summary');
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.chat_id).toBe('222'); // from test/setup.ts
    expect(body.text).toBe('summary');
  });
});
