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

// OpenAI's strict json_schema mode rejects `propertyNames` (which z.record
// emits), so categories is a fixed object of the 9 budget categories from
// the system prompt. If a receipt has no items in a category, return it with
// empty items and zeros.
export const categoriesSchema = z.object({
  groceries: categoryBreakdownSchema,
  babySupplies: categoryBreakdownSchema,
  bathroomSupplies: categoryBreakdownSchema,
  houseSupplies: categoryBreakdownSchema,
  pharmacy: categoryBreakdownSchema,
  clothing: categoryBreakdownSchema,
  petSupplies: categoryBreakdownSchema,
  charity: categoryBreakdownSchema,
  unknown: categoryBreakdownSchema,
});

export const receiptResponseSchema = z.object({
  storeName: z.string(),
  date: z.string(),
  missingStoreName: z.boolean(),
  missingDate: z.boolean(),
  categories: categoriesSchema,
  originalTotal: z.number(),
  hasUnclearItems: z.boolean().optional().default(false),
  hasMissingItems: z.boolean().optional().default(false),
  credit: creditSchema.optional(),
});

export type ReceiptResponse = z.infer<typeof receiptResponseSchema>;
