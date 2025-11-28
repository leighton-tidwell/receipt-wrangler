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
  categories: Record<string, CategoryBreakdown>;
  originalTotal: number;
  hasUnclearItems?: boolean;
  hasMissingItems?: boolean;
  giftCardAmount?: number;
  giftCardCategory?: string;
}

export interface PageData {
  page: 'password' | 'upload' | 'review' | 'done' | 'error';
  error?: string;
  receipt?: ParsedReceipt;
  imageData?: string[];
  previousInstructions?: string;
  receiptText?: string;
}
