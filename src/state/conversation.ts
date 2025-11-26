export type ConversationState =
  | "IDLE"
  | "PROCESSING"
  | "AWAITING_ANSWER"
  | "AWAITING_CONFIRM";

export interface ReceiptItem {
  name: string;
  price: number;
  taxable: boolean;
}

export interface CategoryBreakdown {
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
}

export interface ParsedReceipt {
  storeName: string;
  date: string;
  categories: {
    groceries: CategoryBreakdown;
    babySupplies: CategoryBreakdown;
    bathroomSupplies: CategoryBreakdown;
    houseSupplies: CategoryBreakdown;
    charity: CategoryBreakdown;
  };
  originalTotal: number;
}

export interface ConversationData {
  state: ConversationState;
  pendingImages: string[]; // URLs of images waiting to be processed
  parsedReceipt: ParsedReceipt | null;
  userGuidance: string | null; // Any instructions the user provided
  lastActivity: Date;
}

// In-memory store - only one conversation (wife's number)
let conversation: ConversationData = {
  state: "IDLE",
  pendingImages: [],
  parsedReceipt: null,
  userGuidance: null,
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
    state: "IDLE",
    pendingImages: [],
    parsedReceipt: null,
    userGuidance: null,
    lastActivity: new Date(),
  };
}
