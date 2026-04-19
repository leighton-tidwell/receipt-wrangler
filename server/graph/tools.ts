import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const verifyTotals = tool(
  async ({
    categoryTotals,
    expectedTotal,
  }: {
    categoryTotals: number[];
    expectedTotal: number;
  }) => {
    const actualSum = categoryTotals.reduce((sum, n) => sum + n, 0);
    const difference = actualSum - expectedTotal;
    console.log('[verifyTotals]', { actualSum, expectedTotal, difference });
    return JSON.stringify({
      valid: difference === 0,
      actualSum,
      expectedTotal,
      difference,
      message:
        difference === 0
          ? 'Totals match!'
          : `Mismatch of ${difference} cents. Consider adding missing items to unknown category.`,
    });
  },
  {
    name: 'verifyTotals',
    description:
      'Optional sanity check that category totals sum to the expected receipt total. Returns validity and any difference in cents.',
    schema: z.object({
      categoryTotals: z
        .array(z.number())
        .describe('Array of total values (in cents) for each category'),
      expectedTotal: z.number().describe('The expected total from the receipt (in cents)'),
    }),
  }
);

export const allTools = [verifyTotals];
