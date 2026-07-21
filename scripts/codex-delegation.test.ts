import { describe, it } from "vitest";

import { assertTypedDelegationContract } from "@retaxmaster/my-plants-species-schema/agent-kit/codex-parity/repo-checks";

// The fixture suite that used to live here (checkTypedDelegationContract behavior exercised against a
// scratch repo) now lives once in the shared package: src/agent-kit/codex-parity/codex-delegation.test.ts.
// This file keeps only the real-repo assertion, delegated to the shared, parameterized check (§8.2 Rule 2
// / Task 13.3). The `describe` title carries this repo's identity — the shared assertion does not
// interpolate `label` into its own failure messages, so this title is the ONLY place a red run can be
// attributed to this repo.
// REPO_ROOT is process.cwd(): npm/vitest run this file with cwd = this repo's root (agent-kit's own
// generate-codex-agents.ts, which used to host REPO_ROOT, has moved into the shared package — Task 13.3).
describe("the real KE repo delegation contract", () => {
  it("documents a valid typed spawn for every generated role", () => {
    assertTypedDelegationContract("the real KE repo", process.cwd());
  });
});
