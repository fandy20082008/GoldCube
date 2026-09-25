import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { checkPublicSnapshot } from "./check-public-snapshot.mjs";
import { checkSourceProvenance } from "./check-source-provenance.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const appLicense = readFileSync(join(root, "LICENSE"));
const git = (cwd, ...args) =>
  execFileSync("git", ["-c", "core.autocrlf=false", ...args], {
    cwd, encoding: args.includes("archive") ? undefined : "utf8",
    env: { ...process.env, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: process.platform === "win32" ? "NUL" : "/dev/null" },
  });
function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), "public-source-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const entries = {};
  for (const [role, files] of Object.entries({
    application: {
      "LICENSE": appLicense, "LEGAL_NOTICE.md": "notice\n",
      "THIRD_PARTY_LICENSES.md": "third party\n", "README.md": "readme\n",
      "web/Dockerfile": "FROM scratch\n", "docs/Dockerfile": "FROM scratch\n",
      "web/src/app.ts": "export const a = 1;\n",
    },
    gateway: {
      "LICENSE": appLicense, "NOTICE": "notice\n",
      "THIRD_PARTY_NOTICES": "third party\n", "README.md": "readme\n",
      "serve.js": "export const a = 1;\n", "app.js": "export const b = 2;\n",
    },
  })) {
    const cwd = join(directory, role);
    mkdirSync(cwd);
    git(cwd, "init", "-q");
    git(cwd, "config", "user.name", "Fixture");
    git(cwd, "config", "user.email", "fixture@example.invalid");
    for (const [name, bytes] of Object.entries(files)) {
      mkdirSync(dirname(join(cwd, name)), { recursive: true });
      writeFileSync(join(cwd, name), bytes);
    }
    git(cwd, "add", ".");
    git(cwd, "commit", "-qm", "new public root");
    const commit = git(cwd, "rev-parse", "HEAD").trim();
    entries[role] = {
      cwd,
      repository: `fandy20082008/${role === "application" ? "GoldCube" : "GoldCube-Gateway"}`,
      developmentCommit: "a".repeat(40),
      developmentTree: "b".repeat(40),
      baselineEvidenceSha256: "c".repeat(64),
      reviewedScopeSha256: "d".repeat(64),
      commit, rootCommit: commit,
      tree: git(cwd, "rev-parse", "HEAD^{tree}").trim(),
      membersSha256: hash(git(cwd, "ls-tree", "-rz", "HEAD")),
      archiveSha256: hash(git(cwd, "-c", "core.eol=lf", "archive", "--format=tar", "HEAD")),
      licenseBlob: git(cwd, "rev-parse", "HEAD:LICENSE").trim(),
    };
  }
  const proof = {
    schemaVersion: 1, kind: "public-snapshot",
    baseline: "04b32d31ca00272e3866c85e9a8329036c63af72",
    review: { decision: "approved", reviewer: "Fixture", reviewedAt: "2026-09-24T00:00:00Z" },
    snapshots: Object.fromEntries(Object.entries(entries).map(([role, { cwd, ...value }]) => [role, value])),
  };
  const input = (role = "application") => {
    const proofBytes = Buffer.from(JSON.stringify(proof));
    return {
      cwd: entries[role].cwd, component: role, proofBytes,
      trustedSha256: hash(proofBytes), expectedCommit: entries[role].commit,
      expectedRepository: entries[role].repository,
    };
  };
  return { entries, proof, input };
}

test("both new roots bind to one externally pinned proof and canonical archives", (t) => {
  const f = fixture(t);
  for (const role of ["application", "gateway"]) {
    const result = checkPublicSnapshot(f.input(role));
    assert.equal(result.commit, f.entries[role].commit);
    assert.equal(result.peerCommit, f.entries[role === "application" ? "gateway" : "application"].commit);
  }
  const input = f.input();
  assert.equal(checkSourceProvenance(input.cwd, {
    GOLDCUBE_SOURCE_MODE: "public-snapshot",
    GOLDCUBE_SNAPSHOT_PROOF: input.proofBytes.toString(),
    GOLDCUBE_SNAPSHOT_PROOF_SHA256: input.trustedSha256,
    GOLDCUBE_SNAPSHOT_COMMIT: input.expectedCommit,
  }).commit, input.expectedCommit);
});

for (const [name, change] of [
  ["missing proof", (f, input) => { input.proofBytes = Buffer.alloc(0); }],
  ["untrusted proof", (f, input) => { input.trustedSha256 = "0".repeat(64); }],
  ["swapped repository", (f, input) => { input.expectedRepository = "fandy20082008/GoldCube-Gateway"; }],
  ["wrong tree", (f) => { f.proof.snapshots.application.tree = "e".repeat(40); }],
  ["wrong member", (f) => { f.proof.snapshots.application.membersSha256 = "e".repeat(64); }],
  ["wrong archive", (f) => { f.proof.snapshots.application.archiveSha256 = "e".repeat(64); }],
  ["wrong license", (f) => { f.proof.snapshots.application.licenseBlob = "e".repeat(40); }],
  ["absent audit", (f) => { delete f.proof.review; }],
  ["wrong baseline", (f) => { f.proof.baseline = "e".repeat(40); }],
  ["missing development review", (f) => { delete f.proof.snapshots.application.baselineEvidenceSha256; }],
  ["new parent", (f) => { f.proof.snapshots.application.rootCommit = "e".repeat(40); }],
]) {
  test(`public proof rejects ${name}`, (t) => {
    const f = fixture(t);
    const input = f.input();
    change(f, input);
    if (name !== "missing proof" && name !== "untrusted proof" && name !== "swapped repository") {
      input.proofBytes = Buffer.from(JSON.stringify(f.proof));
      input.trustedSha256 = hash(input.proofBytes);
    }
    assert.throws(() => checkPublicSnapshot(input), /公开快照来源阻断/);
  });
}
test("one-sided peer replacement fails the other repository's independent gate", (t) => {
  const f = fixture(t);
  f.proof.snapshots.gateway.commit = "e".repeat(40);
  const input = f.input("gateway");
  assert.throws(() => checkPublicSnapshot(input), /公开快照来源阻断/);
});
test("modified root tree or extra commit cannot reuse signed old proof", (t) => {
  const f = fixture(t);
  const input = f.input();
  writeFileSync(join(input.cwd, "web", "src", "app.ts"), "changed\n");
  git(input.cwd, "add", ".");
  git(input.cwd, "commit", "-qm", "later change");
  assert.throws(() => checkPublicSnapshot(input), /公开快照来源阻断/);
});
test("unknown mode and missing public evidence fail closed", (t) => {
  const f = fixture(t);
  assert.throws(() => checkSourceProvenance(f.entries.application.cwd, { GOLDCUBE_SOURCE_MODE: "skip" }), /未知来源模式/);
  assert.throws(() => checkSourceProvenance(f.entries.application.cwd, { GOLDCUBE_SOURCE_MODE: "public-snapshot" }), /公开快照来源阻断/);
});
