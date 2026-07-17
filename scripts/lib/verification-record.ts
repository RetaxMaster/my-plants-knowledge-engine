import { readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * The per-engine "codex roles verified" record (spec §5 fallback-safety).
 *
 * A small JSON file under the engine's OWN state dir. It records whether the CURRENTLY DEPLOYED codex
 * launch actually loads this repo's `.codex/agents/` roles. It is DEFAULT-DENY: absent, unreadable,
 * non-boolean, or false ⇒ Codex is treated as UNAVAILABLE for this pipeline. It is read FRESH on every
 * call (never cached at process boot) so a running API adopts a state change without a restart — closing
 * the deploy-window race (Spec 3 §7). Writes are ATOMIC (temp-write + rename).
 *
 * CANONICAL on-disk contract — the API reader (Spec 3 §8 / api-platform plan Task 9,
 * CodexRoleVerificationService) reads this EXACT path + field; they MUST agree byte-for-byte or the gate
 * silently denies:
 *   file:   <stateDir>/codex-roles-verified.json     ← per-engine by which state dir, NOT by name-in-filename
 *   shape:  {"codexRolesVerified": boolean}
 * The per-engine keying is the STATE DIR the caller passes (PLANT_DOCTOR_STATE_DIR for the doctor, the KE
 * state dir for the KE). This same module is mirrored between the doctor and KE repos so both probes write
 * their record under the identical contract (fork-prevention: change one, change both in the same commit).
 */
const RECORD_FILENAME = "codex-roles-verified.json";

function recordPath(stateDir: string): string {
  return path.join(stateDir, RECORD_FILENAME);
}

export function readCodexRolesVerified(stateDir: string): boolean {
  try {
    const raw = readFileSync(recordPath(stateDir), "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return (
      typeof parsed === "object" &&
      parsed !== null &&
      (parsed as Record<string, unknown>).codexRolesVerified === true
    );
  } catch {
    return false; // default-deny on absent / unreadable / malformed
  }
}

export function writeCodexRolesVerified(stateDir: string, verified: boolean): void {
  const target = recordPath(stateDir);
  const tmp = `${target}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(tmp, `${JSON.stringify({ codexRolesVerified: verified })}\n`);
  renameSync(tmp, target); // atomic swap
}
