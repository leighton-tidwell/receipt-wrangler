export type ConversationState = 'IDLE' | 'PROCESSING' | 'AWAITING_STORE_INFO' | 'AWAITING_CONFIRM';

export interface ReceiptItem {
  name: string;
  price: number;
  taxable: boolean;
  unclear?: boolean;
}

export interface CategoryBreakdown {
  items: ReceiptItem[];
  subtotal: number;
  fees: number;
  tax: number;
  total: number;
}

export interface ParsedReceipt {
  storeName: string;
  date: string;
  missingStoreName: boolean;
  missingDate: boolean;
  categories: {
    groceries: CategoryBreakdown;
    babySupplies: CategoryBreakdown;
    bathroomSupplies: CategoryBreakdown;
    houseSupplies: CategoryBreakdown;
    pharmacy: CategoryBreakdown;
    charity: CategoryBreakdown;
    unknown: CategoryBreakdown;
    [key: string]: CategoryBreakdown; // Allow custom categories
  };
  originalTotal: number;
  hasUnclearItems?: boolean;
  hasMissingItems?: boolean;
  giftCardAmount?: number; // Gift card payment amount in cents
  giftCardCategory?: string; // User-specified category to apply gift card to first
}

export interface ConversationData {
  state: ConversationState;
  pendingImages: string[]; // URLs of images waiting to be processed
  parsedReceipt: ParsedReceipt | null;
  userGuidance: string | null; // Any instructions the user provided
  senderPhone: string | null; // Who started this conversation
  lastActivity: Date;
}

// In-memory store - one conversation at a time
let conversation: ConversationData = {
  state: 'IDLE',
  pendingImages: [],
  parsedReceipt: null,
  userGuidance: null,
  senderPhone: null,
  lastActivity: new Date(),
};

export function getConversation(): ConversationData {
  return conversation;
}

export function updateConversation(updates: Partial<ConversationData>): void {
  conversation = {
    ...conversation,
    ...updates,
    lastActivity: new Date(),
  };
}

export function resetConversation(): void {
  conversation = {
    state: 'IDLE',
    pendingImages: [],
    parsedReceipt: null,
    userGuidance: null,
    senderPhone: null,
    lastActivity: new Date(),
  };
}
