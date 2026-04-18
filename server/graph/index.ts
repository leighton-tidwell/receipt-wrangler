import { END, START, StateGraph } from '@langchain/langgraph';
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import {
  awaitConfirmationNode,
  collectImagesNode,
  parseReceiptNode,
  routeAfterCollect,
  routeAfterConfirmation,
} from '@/server/graph/nodes.js';
import { sendNode } from '@/server/graph/send.js';
import { ReceiptGraphState } from '@/server/graph/state.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const checkpointPath = process.env.CHECKPOINT_DB || `${__dirname}/../../data/checkpoints.db`;

let _checkpointer: ReturnType<typeof SqliteSaver.fromConnString> | null = null;
export function getCheckpointer(): ReturnType<typeof SqliteSaver.fromConnString> {
  if (!_checkpointer) _checkpointer = SqliteSaver.fromConnString(checkpointPath);
  return _checkpointer;
}

/** Uncompiled graph builder — exported so tests can compile with MemorySaver. */
export function buildReceiptWorkflow() {
  return new StateGraph(ReceiptGraphState)
    .addNode('collectImages', collectImagesNode)
    .addNode('parseReceipt', parseReceiptNode)
    .addNode('awaitConfirmation', awaitConfirmationNode)
    .addNode('send', sendNode)
    .addEdge(START, 'collectImages')
    .addConditionalEdges('collectImages', routeAfterCollect, {
      collectImages: 'collectImages',
      parseReceipt: 'parseReceipt',
      [END]: END,
    })
    .addEdge('parseReceipt', 'awaitConfirmation')
    .addConditionalEdges('awaitConfirmation', routeAfterConfirmation, {
      send: 'send',
      parseReceipt: 'parseReceipt',
      [END]: END,
    })
    .addEdge('send', END);
}

let _receiptGraph: ReturnType<ReturnType<typeof buildReceiptWorkflow>['compile']> | null = null;
export function getReceiptGraph() {
  if (!_receiptGraph) {
    _receiptGraph = buildReceiptWorkflow().compile({ checkpointer: getCheckpointer() });
  }
  return _receiptGraph;
}

/**
 * Proxy so existing imports (`receiptGraph.invoke(...)`) keep working while
 * avoiding eager SqliteSaver initialization at module-load time (which would
 * require the native binding during tests).
 */
export const receiptGraph = new Proxy({} as ReturnType<typeof getReceiptGraph>, {
  get(_target, prop) {
    const g = getReceiptGraph() as unknown as Record<string | symbol, unknown>;
    const value = g[prop];
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(g) : value;
  },
});

export type ReceiptGraph = typeof receiptGraph;
