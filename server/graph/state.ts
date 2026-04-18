import { BaseMessage } from '@langchain/core/messages';
import { Annotation, messagesStateReducer } from '@langchain/langgraph';

import type { ParsedReceipt } from '@/server/state/conversation.js';

export const ReceiptGraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  pendingImages: Annotation<string[]>({
    reducer: (curr, next) => {
      if (next === null) return [];
      return curr.concat(next);
    },
    default: () => [],
  }),
  textContent: Annotation<string | null>({
    reducer: (_curr, next) => next,
    default: () => null,
  }),
  userGuidance: Annotation<string | null>({
    reducer: (_curr, next) => next,
    default: () => null,
  }),
  parsedReceipt: Annotation<ParsedReceipt | null>({
    reducer: (_curr, next) => next,
    default: () => null,
  }),
  confirmationResult: Annotation<'approve' | 'edit' | 'reject' | null>({
    reducer: (_curr, next) => next,
    default: () => null,
  }),
  channel: Annotation<'telegram' | 'web'>({
    reducer: (_curr, next) => next,
    default: () => 'telegram',
  }),
  chatId: Annotation<string | null>({
    reducer: (_curr, next) => next,
    default: () => null,
  }),
});

export type ReceiptGraphStateType = typeof ReceiptGraphState.State;
