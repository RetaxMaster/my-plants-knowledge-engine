#!/usr/bin/env tsx
/**
 * SPIKE (throwaway): does `codex app-server`, launched with cwd = a TRUSTED repo that carries
 * .codex/config.toml + .codex/agents/, load that config + those agent roles the way `codex exec -C`
 * does? This is the one integration unknown (spec §5, ledger decision #4). Delete after the outcome
 * is recorded, UNLESS Path B makes it the deploy's app-server certifier.
 *
 * Launch matches the vendored agents-realtime codex adapter EXACTLY (buildAppServerArgs):
 *   spawn(bin, ["app-server", "--listen", "stdio://", "-c", "model_reasoning_summary=detailed"], { cwd })
 *
 * The app-server speaks line-delimited JSON-RPC over stdio. Discovered surface (via
 * `codex app-server generate-json-schema`): `initialize`, `config/read` (returns effective config +
 * per-layer raw config when includeLayers=true), `thread/start`, `turn/start`, and TurnCompleted /
 * AgentMessage notifications.
 *
 * Two stages:
 *   FREE   — initialize + config/read(includeLayers): does a config LAYER come from <repo>/.codex/config.toml,
 *            and does it carry features.multi_agent_v2.enabled=true? (proves project-config discovery from cwd)
 *   BILLABLE (only when PROBE_BILLABLE=1) — thread/start + ONE turn asking the model to enumerate the
 *            agent_type values its spawn_agent tool exposes. If it returns the repo's roles, app-server
 *            loads .codex/agents/ from cwd → Path A. Run at most ONCE (billable).
 *
 * A timeout is NOT success: any stage that does not confirm exits NON-ZERO.
 */
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

const CWD =
  process.env.PROBE_CWD ??
  "/home/retaxmaster/projects/retaxmaster-workspace/repos/resume-optimizer";
const BIN = process.env.CODEX_BIN ?? "codex";
const BILLABLE = process.env.PROBE_BILLABLE === "1";

interface Pending {
  resolve: (value: Record<string, unknown>) => void;
  reject: (err: Error) => void;
}

const child: ChildProcessWithoutNullStreams = spawn(
  BIN,
  ["app-server", "--listen", "stdio://", "-c", "model_reasoning_summary=detailed"],
  { cwd: CWD },
);

const pending = new Map<number, Pending>();
const notifications: Array<Record<string, unknown>> = [];
let buf = "";

child.on("error", (e) => {
  console.error(`spawn failed: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});

child.stdout.setEncoding("utf8");
child.stdout.on("data", (chunk: string) => {
  buf += chunk;
  for (let nl = buf.indexOf("\n"); nl >= 0; nl = buf.indexOf("\n")) {
    const line = buf.slice(0, nl).trim();
    buf = buf.slice(nl + 1);
    if (!line) continue;
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(line) as Record<string, unknown>;
    } catch {
      console.error(`[non-json] ${line}`);
      continue;
    }
    const id = typeof msg.id === "number" ? msg.id : undefined;
    if (id !== undefined && pending.has(id)) {
      const p = pending.get(id)!;
      pending.delete(id);
      if (msg.error) p.reject(new Error(JSON.stringify(msg.error)));
      else p.resolve((msg.result as Record<string, unknown>) ?? {});
    } else if (msg.method) {
      notifications.push(msg);
      console.error(`[notif] ${String(msg.method)}`);
    }
  }
});
child.stderr.setEncoding("utf8");
child.stderr.on("data", (c: string) => console.error(`[stderr] ${c.trimEnd()}`));

let nextId = 1;
function call(method: string, params: unknown, timeoutMs = 20_000): Promise<Record<string, unknown>> {
  const id = nextId++;
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error(`timeout waiting for ${method}`));
      }
    }, timeoutMs);
  });
}

function findMultiAgentLayer(result: Record<string, unknown>): { source: unknown; enabled: unknown } | null {
  const layers = result.layers;
  if (!Array.isArray(layers)) return null;
  for (const layer of layers as Array<Record<string, unknown>>) {
    const cfg = layer.config as Record<string, unknown> | undefined;
    const features = cfg?.features as Record<string, unknown> | undefined;
    const ma = features?.multi_agent_v2 as Record<string, unknown> | undefined;
    if (ma !== undefined) {
      return { source: layer.name, enabled: ma.enabled };
    }
  }
  return null;
}

async function main(): Promise<void> {
  const init = await call("initialize", { clientInfo: { name: "spike", version: "0" } });
  console.error(`--- initialize OK; codexHome=${String(init.codexHome)} ---`);

  // FREE stage: config layers as seen from the server's process cwd (= CWD, matching the adapter).
  const cfg = await call("config/read", { includeLayers: true });
  const layers = Array.isArray(cfg.layers) ? (cfg.layers as Array<Record<string, unknown>>) : [];
  console.error(`--- config/read OK; ${layers.length} layer(s):`);
  for (const l of layers) console.error(`      layer name=${JSON.stringify(l.name)}`);
  let ma = findMultiAgentLayer(cfg);

  // Also resolve WITH an explicit cwd = the trusted repo, to see whether project-layer discovery works
  // at all (the runtime never passes a thread cwd, but this isolates "project discovery" from
  // "process-cwd auto-apply").
  const cfgCwd = await call("config/read", { includeLayers: true, cwd: CWD });
  const layersCwd = Array.isArray(cfgCwd.layers) ? (cfgCwd.layers as Array<Record<string, unknown>>) : [];
  console.error(`--- config/read(cwd=${CWD}) OK; ${layersCwd.length} layer(s):`);
  for (const l of layersCwd) console.error(`      layer name=${JSON.stringify(l.name)}`);
  const maCwd = findMultiAgentLayer(cfgCwd);
  console.error(
    maCwd
      ? `>>> config/read(cwd) DOES surface features.multi_agent_v2 (enabled=${JSON.stringify(
          maCwd.enabled,
        )}), source=${JSON.stringify(maCwd.source)} — project discovery works WHEN cwd is passed.`
      : ">>> config/read(cwd) does NOT surface the project .codex/config.toml even with cwd passed.",
  );
  ma = ma ?? maCwd;

  if (ma) {
    console.error(
      `>>> FREE SIGNAL: a config layer carries features.multi_agent_v2 (enabled=${JSON.stringify(
        ma.enabled,
      )}), source=${JSON.stringify(ma.source)} — project .codex/config.toml IS discovered from cwd.`,
    );
  } else {
    console.error(
      ">>> FREE SIGNAL: NO config layer carries features.multi_agent_v2 — the repo's .codex/config.toml did NOT load from cwd (Path-B signal).",
    );
  }

  // FREE: start a thread exactly the adapter's way (NO cwd override — it relies solely on process cwd).
  // Inspect the thread's resolved cwd: if it equals the process cwd (the trusted repo), the thread runs
  // in the project dir and — given project discovery works for that dir — should load its .codex/.
  const thread = await call("thread/start", { sandbox: "read-only", approvalPolicy: "never" });
  const threadObj = thread.thread as Record<string, unknown> | undefined;
  const threadId = threadObj?.id ?? thread.threadId;
  console.error(
    `--- thread/start OK; threadId=${String(threadId)}; resolved cwd=${JSON.stringify(thread.cwd)} (process cwd=${CWD}) ---`,
  );

  if (!BILLABLE) {
    console.error(
      "--- BILLABLE stage skipped (set PROBE_BILLABLE=1 to run ONE turn confirming .codex/agents/ load). ---",
    );
    child.kill();
    process.exit(ma ? 0 : 1);
  }

  // BILLABLE stage: one turn. Ask the model to enumerate the spawn_agent agent_type values it sees.

  const prompt =
    "Do not read files or call any tools. Inspect ONLY the tools available to you this turn. " +
    "If you have a tool named spawn_agent, output a single JSON object " +
    '{"has_spawn_agent": true, "agent_types": [<the exact accepted agent_type enum values>]}. ' +
    'If you have NO spawn_agent tool, output {"has_spawn_agent": false, "agent_types": []}. Output only that JSON, no prose.';

  const turnDone = new Promise<void>((resolve) => {
    const check = setInterval(() => {
      if (notifications.some((n) => String(n.method).toLowerCase().includes("turncompleted"))) {
        clearInterval(check);
        resolve();
      }
    }, 250);
    setTimeout(() => {
      clearInterval(check);
      resolve();
    }, 100_000);
  });

  await call("turn/start", { threadId, input: [{ type: "text", text: prompt }] }, 110_000);
  await turnDone;

  // Extract assistant text from AgentMessage notifications.
  let text = "";
  for (const n of notifications) {
    const params = n.params as Record<string, unknown> | undefined;
    const method = String(n.method);
    if (method.toLowerCase().includes("agentmessage")) {
      const delta = (params?.delta as string) ?? (params?.text as string) ?? "";
      if (typeof delta === "string") text += delta;
    }
    const item = params?.item as Record<string, unknown> | undefined;
    if (item && typeof item.text === "string" && String(item.type ?? "").includes("agent")) {
      text += item.text;
    }
  }
  console.error("--- ASSISTANT RAW ---");
  console.error(text || "(no agent text captured — inspect [notif] lines above)");

  child.kill();
  process.exit(0);
}

main().catch((e) => {
  console.error(`PROBE ERROR: ${e instanceof Error ? e.message : String(e)}`);
  child.kill();
  process.exit(1);
});
