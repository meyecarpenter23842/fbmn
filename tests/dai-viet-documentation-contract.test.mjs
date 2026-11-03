import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const docs = [
  "docs/dai-viet/README.md",
  "docs/dai-viet/00-master-plan.md",
  "docs/dai-viet/01-design-system.md",
  "docs/dai-viet/02-architecture-data.md",
  "docs/dai-viet/03-delivery-workflow.md",
  "docs/dai-viet/04-page-specifications.md",
  "docs/dai-viet/05-acceptance-security.md",
  "docs/dai-viet/06-decisions-register.md",
  "docs/dai-viet/07-new-project-handoff.md",
  "apps/dai-viet/AGENTS.md",
];

test("Dai Viet has a readable canonical master and scoped project rules", () => {
  for (const path of docs) {
    assert.ok(existsSync(path), path + " must exist");
    assert.ok(readFileSync(path, "utf8").length > 500, path + " must be substantive");
  }
  const root = readFileSync("AGENTS.md", "utf8");
  const scoped = readFileSync("apps/dai-viet/AGENTS.md", "utf8");
  assert.match(root, /docs\/dai-viet\/00-master-plan\.md/);
  assert.match(root, /apps\/dai-viet\/AGENTS\.md/);
  assert.match(scoped, /00-master-plan\.md/);
  assert.match(scoped, /KHÔNG CODE/);
});

test("Dai Viet brand stays independent and preserves shared control geometry", () => {
  const design = readFileSync("docs/dai-viet/01-design-system.md", "utf8");
  const core = readFileSync("docs/futurebook-ui-contract.md", "utf8");
  assert.match(design, /#C62828/);
  assert.match(design, /36px/);
  assert.match(design, /44px/);
  assert.match(design, /40px/);
  assert.match(design, /trên phải/);
  assert.match(core, /#6D249E/);
});

test("The new project handoff requires reading main and the plan", () => {
  const handoff = readFileSync("docs/dai-viet/07-new-project-handoff.md", "utf8");
  assert.match(handoff, /00-master-plan\.md/);
  assert.match(handoff, /AGENTS\.md/);
  assert.match(handoff, /main/);
});
