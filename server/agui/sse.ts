import { EventType } from '@ag-ui/core';
import { Command } from '@langchain/langgraph';
import crypto from 'crypto';
import type { Request, Response } from 'express';

import { receiptGraph } from '@/server/graph/index.js';

/**
 * Minimal AG-UI (Agent User Interaction) SSE bridge for the receipt graph.
 *
 * POST body:
 *   { threadId?: string, input?: Partial<GraphState>, resume?: unknown }
 *
 * Emits Server-Sent Events with AG-UI event shapes so future CopilotKit /
 * browser clients can render the run without additional adapters. The Telegram
 * flow uses the graph directly (server/telegram/webhook.ts) rather than this
 * endpoint, but both speak the same protocol.
 */
export async function handleAguiRun(req: Request, res: Response): Promise<void> {
  const { threadId: providedId, input, resume } = req.body ?? {};
  const threadId: string = providedId || `web:${crypto.randomUUID()}`;
  const runId = crypto.randomUUID();
  const cfg = { configurable: { thread_id: threadId } };

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const write = (event: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  write({ type: EventType.RUN_STARTED, threadId, runId });

  try {
    const invokeInput = resume !== undefined ? new Command({ resume }) : input;

    for await (const event of receiptGraph.streamEvents(invokeInput, {
      ...cfg,
      version: 'v2',
    })) {
      switch (event.event) {
        case 'on_chain_start':
          if (event.name && typeof event.name === 'string') {
            write({ type: EventType.STEP_STARTED, stepName: event.name });
          }
          break;
        case 'on_chain_end':
          if (event.name && typeof event.name === 'string') {
            write({ type: EventType.STEP_FINISHED, stepName: event.name });
          }
          break;
        case 'on_chat_model_stream': {
          const chunk = event.data?.chunk as { content?: string } | undefined;
          const content = typeof chunk?.content === 'string' ? chunk.content : '';
          if (content) {
            write({
              type: EventType.TEXT_MESSAGE_CHUNK,
              messageId: event.run_id,
              delta: content,
            });
          }
          break;
        }
        default:
          break;
      }
    }

    // After stream ends, check for pending interrupts and surface them as tool calls.
    const snapshot = await receiptGraph.getState(cfg);
    const interrupts = (snapshot.tasks ?? []).flatMap((t) => t.interrupts ?? []);
    for (const interrupt of interrupts) {
      const toolCallId = crypto.randomUUID();
      const value = interrupt.value as { type?: string } | undefined;
      const toolName = value?.type ?? 'human_interrupt';
      write({
        type: EventType.TOOL_CALL_START,
        toolCallId,
        toolCallName: toolName,
      });
      write({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId,
        delta: JSON.stringify(value ?? {}),
      });
      write({ type: EventType.TOOL_CALL_END, toolCallId });
    }

    write({ type: EventType.RUN_FINISHED, threadId, runId });
  } catch (err) {
    console.error('[agui] run error:', err);
    write({
      type: EventType.RUN_ERROR,
      message: err instanceof Error ? err.message : 'unknown error',
    });
  } finally {
    res.end();
  }
}
