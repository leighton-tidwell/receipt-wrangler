import { ReceiptGraphStateType } from '@/server/graph/state.js';
import { sendToReceiver, sendToSender } from '@/server/telegram/send.js';
import { formatFinalSummary } from '@/server/utils/format.js';

export async function sendNode(state: ReceiptGraphStateType) {
  if (!state.parsedReceipt) return {};
  const summary = formatFinalSummary(state.parsedReceipt);

  try {
    await sendToReceiver(summary);
    if (state.channel === 'telegram' && state.chatId) {
      await sendToSender(state.chatId, 'Done! Sent the breakdown to the budget.');
    }
  } catch (err) {
    console.error('[sendNode] failed to deliver summary:', err);
  }
  return {};
}
