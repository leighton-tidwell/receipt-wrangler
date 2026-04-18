import { z } from 'zod';

export const receiptItemSchema = z.object({
  name: z.string(),
  price: z.number(),
  taxable: z.boolean(),
  unclear: z.boolean().optional().default(false),
});

export const categoryBreakdownSchema = z.object({
  items: z.array(receiptItemSchema),
  subtotal: z.number(),
  fees: z.number(),
  tax: z.number(),
  total: z.number(),
});

export const creditSchema = z.object({
  amount: z.number(),
  targetCategory: z.string().optional(),
});

export const receiptResponseSchema = z.object({
  storeName: z.string(),
  date: z.string(),
  missingStoreName: z.boolean(),
  missingDate: z.boolean(),
  categories: z.record(z.string(), categoryBreakdownSchema),
  originalTotal: z.number(),
  hasUnclearItems: z.boolean().optional().default(false),
  hasMissingItems: z.boolean().optional().default(false),
  credit: creditSchema.optional(),
});

export type ReceiptResponse = z.infer<typeof receiptResponseSchema>;
