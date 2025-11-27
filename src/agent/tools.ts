import { tool } from "ai";
import { z } from "zod";

export const verifyTotals = tool({
  description:
    "Optional sanity check to verify that category totals sum to the expected receipt total. Returns whether they match and any difference.",
  inputSchema: z.object({
    categoryTotals: z
      .array(z.number())
      .describe("Array of total values (in cents) for each category"),
    expectedTotal: z
      .number()
      .describe("The expected total from the receipt (in cents)"),
  }),
  execute: async ({
    categoryTotals,
    expectedTotal,
  }: {
    categoryTotals: number[];
    expectedTotal: number;
  }) => {
    console.log("[verifyTotals] Called with:", {
      categoryTotals,
      expectedTotal,
    });

    const actualSum = categoryTotals.reduce(
      (sum: number, total: number) => sum + total,
      0
    );
    const difference = actualSum - expectedTotal;

    console.log("[verifyTotals] Result:", {
      valid: difference === 0,
      actualSum,
      difference,
    });
    return {
      valid: difference === 0,
      actualSum,
      expectedTotal,
      difference,
      message:
        difference === 0
          ? "Totals match!"
          : `Mismatch of ${difference} cents. Consider adding missing items to unknown category.`,
    };
  },
});
