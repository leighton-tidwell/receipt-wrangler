import { END } from '@langchain/langgraph';
import { describe, expect, it } from 'vitest';

import { routeAfterCollect, routeAfterConfirmation } from '@/server/graph/nodes.js';
import type { ReceiptGraphStateType } from '@/server/graph/state.js';

function stateWith(overrides: Partial<ReceiptGraphStateType>): ReceiptGraphStateType {
  return {
    messages: [],
    pendingImages: [],
    textContent: null,
    userGuidance: null,
    parsedReceipt: null,
    confirmationResult: null,
    collectionDone: false,
    cancelled: false,
    channel: 'telegram',
    chatId: null,
    ...overrides,
  } as ReceiptGraphStateType;
}

describe('routeAfterCollect', () => {
  it('loops to collectImages while not done', () => {
    expect(routeAfterCollect(stateWith({}))).toBe('collectImages');
  });
  it('moves to parseReceipt once collectionDone', () => {
    expect(routeAfterCollect(stateWith({ collectionDone: true }))).toBe('parseReceipt');
  });
  it('terminates when cancelled', () => {
    expect(routeAfterCollect(stateWith({ cancelled: true }))).toBe(END);
  });
});

describe('routeAfterConfirmation', () => {
  it("routes approve → 'send'", () => {
    expect(routeAfterConfirmation(stateWith({ confirmationResult: 'approve' }))).toBe('send');
  });
  it("routes edit → 'parseReceipt' (re-parse with corrections)", () => {
    expect(routeAfterConfirmation(stateWith({ confirmationResult: 'edit' }))).toBe('parseReceipt');
  });
  it('routes reject → END', () => {
    expect(routeAfterConfirmation(stateWith({ confirmationResult: 'reject' }))).toBe(END);
  });
  it('routes null → END (no decision = cancel)', () => {
    expect(routeAfterConfirmation(stateWith({ confirmationResult: null }))).toBe(END);
  });
});
