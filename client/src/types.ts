export interface ReceiptItem {
  name: string;
  price: number;
  taxable: boolean;
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
}

export interface PageData {
  page: "password" | "upload" | "review" | "done" | "error";
  error?: string;
  receipt?: ParsedReceipt;
  imageData?: string[];
  previousInstructions?: string;
  receiptText?: string;
}

declare global {
  interface Window {
    __PAGE_DATA__?: PageData;
  }
}
