# LangChain Runtime Example

A runnable example for `@atbash/langchain` that wraps a `DynamicStructuredTool` with `withAtbashGuard()` and sends a live Atbash verdict.

No LLM API key required — only an Atbash agent private key.

## What It Does

1. Creates a `DynamicStructuredTool` (`send_bank_transfer`)
2. Wraps it with `withAtbashGuard()`
3. Invokes the guarded tool with a sample action
4. Prints the tool result on `ALLOW`, or the guard error on `BLOCK`

## Prerequisites

Build the plugin and install example dependencies from the repo root:

```bash
npm install && npm run build
cd examples/langchain-runtime-agent && npm install && cd ../..
```

## Run

From repo root:

```bash
ATBASH_AGENT_PRIVKEY=your_key_here node examples/langchain-runtime-agent/run.mjs
```

Custom action:

```bash
ATBASH_AGENT_PRIVKEY=your_key_here node examples/langchain-runtime-agent/run.mjs "Send invoice to external vendor"
```

Override endpoint:

```bash
ATBASH_AGENT_PRIVKEY=your_key_here ATBASH_ENDPOINT=https://your-endpoint.example.com node examples/langchain-runtime-agent/run.mjs
```

## Default Action

The default action is intentionally hold-like to demonstrate the guard working:

```
Bank transfer $25 to a new external vendor account for urgent reimbursement
```

## Expected Output

On `ALLOW`:
```
Atbash agent pubkey: <your pubkey>
Action text: Bank transfer $25 to ...

[Tool Result]
'Simulated LangChain transfer executed: Bank transfer $25 ...'
```

On `BLOCK`:
```
[Guard Result]
<policy reason>
```
