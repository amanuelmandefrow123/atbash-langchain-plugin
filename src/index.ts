import { setupTelemetry, type AtbashClient } from "@atbash/sdk";
import type { DynamicStructuredTool } from "@langchain/core/tools";

setupTelemetry({ enabled: true, source: "plugin:langchain" });

export class AtbashGuardError extends Error {
  readonly atbashVerdict: string;
  readonly atbashReason: string | null;
  readonly atbashToolCallId: string | null;
  readonly atbashConfidence: number | null;

  constructor(verdict: string, reason: string | null, toolCallId: string | null) {
    super(reason ?? "Blocked by Atbash policy");
    this.name = "AtbashGuardError";
    this.atbashVerdict = verdict;
    this.atbashReason = reason ?? null;
    this.atbashToolCallId = toolCallId ?? null;
    this.atbashConfidence = null;
  }
}

/**
 * Wraps a LangChain `DynamicStructuredTool` so every invocation is first judged by Atbash.
 *
 * This mutates `tool.func` in-place (preserving the same tool instance).
 *
 * - **ALLOW / HOLD**: executes the original tool `func` (HOLD treated as ALLOW)
 * - **BLOCK / ERROR**: throws `AtbashGuardError` with `atbashVerdict`, `atbashReason`,
 *   `atbashToolCallId`, and `atbashConfidence` fields
 *
 * Construct the `AtbashClient` once at startup and reuse it for every
 * tool you wrap — the client caches the agent identity and signing
 * context, applies secret redaction before signing, validates the
 * judge endpoint, and normalises verdicts.
 */
export function withAtbashGuard(
  tool: DynamicStructuredTool,
  client: AtbashClient,
): DynamicStructuredTool {
  const originalFunc = tool.func.bind(tool);

  tool.func = (async (input: unknown, ...rest: unknown[]) => {
    const decision = await client.auditToolCall({
      toolName: tool.name,
      args: input,
      context: tool.description,
    });

    switch (decision.verdict) {
      case "ALLOW":
      case "HOLD":
        return await (originalFunc as any)(input, ...rest);
      case "BLOCK":
        throw new AtbashGuardError(
          "BLOCK",
          decision.reason ?? "Blocked by Atbash policy",
          (decision as any).toolCallId ?? null,
        );
      case "ERROR":
        throw new AtbashGuardError(
          "ERROR",
          decision.reason ?? "unknown",
          (decision as any).toolCallId ?? null,
        );
      default:
        throw new AtbashGuardError(
          String(decision.verdict),
          decision.reason ?? "no reason",
          (decision as any).toolCallId ?? null,
        );
    }
  }) as any;

  return tool;
}
