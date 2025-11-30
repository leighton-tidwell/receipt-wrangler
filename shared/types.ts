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
  categories: Record<string, CategoryBreakdown>;
  originalTotal: number;
  hasUnclearItems?: boolean;
  hasMissingItems?: boolean;
  credit?: CreditInfo;
}

export interface PageData {
  page: 'password' | 'upload' | 'review' | 'done' | 'error';
  error?: string;
  receipt?: ParsedReceipt;
  imageData?: string[];
  previousInstructions?: string;
  receiptText?: string;
}
