import { END, START, StateGraph } from '@langchain/langgraph';
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import {
  awaitConfirmationNode,
  collectImagesNode,
  parseReceiptNode,
  routeAfterConfirmation,
} from '@/server/graph/nodes.js';
import { sendNode } from '@/server/graph/send.js';
import { ReceiptGraphState } from '@/server/graph/state.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const checkpointPath = process.env.CHECKPOINT_DB || `${__dirname}/../../data/checkpoints.db`;

export const checkpointer = SqliteSaver.fromConnString(checkpointPath);

export const receiptGraph = new StateGraph(ReceiptGraphState)
  .addNode('collectImages', collectImagesNode)
  .addNode('parseReceipt', parseReceiptNode)
  .addNode('awaitConfirmation', awaitConfirmationNode)
  .addNode('send', sendNode)
  .addEdge(START, 'collectImages')
  .addEdge('collectImages', 'parseReceipt')
  .addEdge('parseReceipt', 'awaitConfirmation')
  .addConditionalEdges('awaitConfirmation', routeAfterConfirmation, {
    send: 'send',
    parseReceipt: 'parseReceipt',
    [END]: END,
  })
  .addEdge('send', END)
  .compile({ checkpointer });

export type ReceiptGraph = typeof receiptGraph;
