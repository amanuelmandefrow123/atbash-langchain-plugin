# `@atbash/langchain`

Guard LangChain tools with Atbash.

This is the lightest Atbash integration — a single function that wraps a `DynamicStructuredTool` and adds a safety check before the tool runs. No graph changes, no framework lifecycle, just a guarded tool boundary.

## Installation

```bash
npm install @atbash/langchain
```

Peer dependency:

```bash
npm install @langchain/core
```

## When To Use It

Use this package when:

- you already use `DynamicStructuredTool`
- you want minimal ceremony
- you only need Atbash at the tool execution boundary

Use `@atbash/langgraph` instead when you need graph-level pause/resume on `HOLD`.

## Quick Start

```ts
import { createAtbashClient, loadAgent } from "@atbash/sdk";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { withAtbashGuard } from "@atbash/langchain";
import { z } from "zod";

const agent = loadAgent(process.env.ATBASH_AGENT_PRIVKEY);
const client = createAtbashClient({
  keyPair: { privKey: agent.privkey, pubKey: agent.pubkey },
});

const tool = new DynamicStructuredTool({
  name: "send_bank_transfer",
  description: "Send a bank transfer to an external vendor account",
  schema: z.object({ request: z.string() }),
  func: async (input) => `Executed: ${input.request}`,
});

withAtbashGuard(tool, client);

try {
  const result = await tool.invoke({ request: "Transfer $25 to vendor" });
  console.log(result);
} catch (error) {
  // BLOCK or ERROR — surface error.message to the operator
  console.error(error.message);
}
```

## API

### `withAtbashGuard(tool, client)`

Mutates `tool.func` in-place. The original tool instance is returned for chaining.

| Parameter | Type | Description |
|---|---|---|
| `tool` | `DynamicStructuredTool` | The tool to guard |
| `client` | `AtbashClient` | SDK client created with `createAtbashClient()` |

Returns the same `tool` instance with its `func` wrapped.

## Verdict Handling

| Verdict | Behavior |
|---|---|
| `ALLOW` | Original tool `func` runs normally |
| `HOLD` | Original tool `func` runs (HOLD treated as ALLOW) |
| `BLOCK` | Throws `Error` with the policy reason |
| `ERROR` | Throws `Error` with the API error message |

Because blocked and errored calls throw, wrap tool invocations in `try/catch` and handle the error deliberately — do not treat all exceptions as generic crashes.

## Creating the Client

Create `AtbashClient` once at startup and reuse it for every guarded tool:

```ts
import { createAtbashClient, loadAgent } from "@atbash/sdk";

const agent = loadAgent(process.env.ATBASH_AGENT_PRIVKEY);
const client = createAtbashClient({
  keyPair: { privKey: agent.privkey, pubKey: agent.pubkey },
  judge: process.env.ATBASH_ENDPOINT
    ? { endpoint: process.env.ATBASH_ENDPOINT }
    : undefined,
});
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ATBASH_AGENT_PRIVKEY` | Yes | Your Atbash agent private key |
| `ATBASH_ENDPOINT` | No | Override the default Atbash endpoint (`https://atbash.ai`) |

## What This Package Does Not Do

- It does not manage a review queue.
- It does not pause and resume execution (use `@atbash/langgraph` for that).
- It does not guard arbitrary business code — only code behind a wrapped `DynamicStructuredTool`.

## Example

A runnable example is in [`examples/langchain-runtime-agent/`](./examples/langchain-runtime-agent/).

```bash
npm install && npm run build
cd examples/langchain-runtime-agent && npm install && cd ../..
ATBASH_AGENT_PRIVKEY=your_key_here node examples/langchain-runtime-agent/run.mjs
```
