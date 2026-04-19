import { z } from 'zod';

// OpenAI's strict json_schema mode requires every property to appear in
// `required` (no optional fields) and rejects unsupported keywords like
// `propertyNames`. Use `.nullable()` instead of `.optional()` and a fixed
// object instead of `z.record()` so the emitted schema is strict-compatible.

export const receiptItemSchema = z.object({
  name: z.string(),
  price: z.number(),
  taxable: z.boolean(),
  unclear: z.boolean(),
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
  targetCategory: z.string().nullable(),
});

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
  hasUnclearItems: z.boolean(),
  hasMissingItems: z.boolean(),
  credit: creditSchema.nullable(),
});

export type ReceiptResponse = z.infer<typeof receiptResponseSchema>;
