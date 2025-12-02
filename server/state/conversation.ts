export type ConversationState =
  | 'IDLE'
  | 'COLLECTING_IMAGES'
  | 'AWAITING_IMAGE_CONFIRM'
  | 'PROCESSING'
  | 'AWAITING_STORE_INFO'
  | 'AWAITING_CONFIRM';

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

export interface CreditInfo {
  amount: number;
  targetCategory?: string;
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
  credit?: CreditInfo;
}

export interface ConversationData {
  state: ConversationState;
  pendingImages: string[]; // URLs of images waiting to be processed
  parsedReceipt: ParsedReceipt | null;
  userGuidance: string | null; // Any instructions the user provided
  senderPhone: string | null; // Who started this conversation
  lastActivity: Date;
  mediaGroupId: string | null; // Track Telegram media groups
  collectionStartTime: Date | null; // When we started collecting images
}

// In-memory store - one conversation at a time
let conversation: ConversationData = {
  state: 'IDLE',
  pendingImages: [],
  parsedReceipt: null,
  userGuidance: null,
  senderPhone: null,
  lastActivity: new Date(),
  mediaGroupId: null,
  collectionStartTime: null,
};

// Timer management for image collection
let collectionTimeoutId: ReturnType<typeof setTimeout> | null = null;
let ackTimeoutId: ReturnType<typeof setTimeout> | null = null;

export function setCollectionTimeout(callback: () => void, delayMs: number): void {
  clearCollectionTimeout();
  collectionTimeoutId = setTimeout(callback, delayMs);
}

export function clearCollectionTimeout(): void {
  if (collectionTimeoutId) {
    clearTimeout(collectionTimeoutId);
    collectionTimeoutId = null;
  }
}

export function setAckTimeout(callback: () => void, delayMs: number): void {
  clearAckTimeout();
  ackTimeoutId = setTimeout(callback, delayMs);
}

export function clearAckTimeout(): void {
  if (ackTimeoutId) {
    clearTimeout(ackTimeoutId);
    ackTimeoutId = null;
  }
}

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
  clearCollectionTimeout();
  clearAckTimeout();
  conversation = {
    state: 'IDLE',
    pendingImages: [],
    parsedReceipt: null,
    userGuidance: null,
    senderPhone: null,
    lastActivity: new Date(),
    mediaGroupId: null,
    collectionStartTime: null,
  };
}
