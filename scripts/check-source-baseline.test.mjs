import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { checkSourceBaseline } from "./check-source-baseline.mjs";

function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), "goldcube-source-gate-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) =>
    execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        GIT_CONFIG_NOSYSTEM: "1",
        GIT_CONFIG_GLOBAL: process.platform === "win32" ? "NUL" : "/dev/null",
      },
    }).trim();
  git("init", "-b", "custom");
  git("config", "user.name", "Source Gate Fixture");
  git("config", "user.email", "fixture@example.invalid");
  git("config", "commit.gpgsign", "false");
  git("config", "core.autocrlf", "false");
  writeFileSync(join(cwd, "LICENSE"), "AGPL fixture, not a legal licence\n");
  git("add", "LICENSE");
  git("commit", "-m", "baseline");
  const baseline = git("rev-parse", "HEAD");
  const licenseBlob = git("rev-parse", "HEAD:LICENSE");
  git("checkout", "-b", "restricted");
  writeFileSync(join(cwd, "LICENSE"), "restricted fixture\n");
  git("commit", "-am", "licence switch");
  const restrictedCommit = git("rev-parse", "HEAD");
  git("checkout", "custom");
  writeFileSync(join(cwd, "independent.txt"), "independent change\n");
  git("add", "independent.txt");
  git("commit", "-m", "independent implementation");
  return { cwd, git, policy: { baseline, licenseBlob, restrictedCommit } };
}

test("complete independent history with unchanged licence passes", (t) => {
  const f = fixture(t);
  assert.equal(
    checkSourceBaseline(f.cwd, f.policy).head,
    f.git("rev-parse", "HEAD"),
  );
});

for (const key of ["baseline", "restrictedCommit", "licenseBlob"]) {
  test(`missing ${key} evidence cannot pass`, (t) => {
    const f = fixture(t);
    assert.throws(
      () => checkSourceBaseline(f.cwd, { ...f.policy, [key]: "f".repeat(40) }),
      /无法验证.*缺少/,
    );
  });
}

test("committed licence modification blocks", (t) => {
  const f = fixture(t);
  writeFileSync(join(f.cwd, "LICENSE"), "changed\n");
  f.git("commit", "-am", "change licence");
  assert.throws(() => checkSourceBaseline(f.cwd, f.policy), /LICENSE.*不一致/);
});

test("restricted ancestor blocks even if old licence is restored", (t) => {
  const f = fixture(t);
  f.git("merge", "--no-edit", "restricted");
  f.git("checkout", f.policy.baseline, "--", "LICENSE");
  f.git("commit", "-m", "restore old text");
  assert.throws(() => checkSourceBaseline(f.cwd, f.policy), /BUSL.*历史/);
});

test("unrelated history blocks even if licence matches", (t) => {
  const f = fixture(t);
  f.git("checkout", "--orphan", "unrelated");
  f.git("commit", "-m", "unrelated root");
  assert.throws(() => checkSourceBaseline(f.cwd, f.policy), /不是 HEAD 的祖先/);
});

test("shallow history fails closed", (t) => {
  const f = fixture(t);
  writeFileSync(join(f.cwd, ".git", "shallow"), `${f.policy.baseline}\n`);
  assert.throws(() => checkSourceBaseline(f.cwd, f.policy), /浅克隆/);
});

test("missing parent objects fail closed", (t) => {
  const f = fixture(t);
  const parent = f.git("rev-parse", "HEAD");
  f.git("commit", "--allow-empty", "-m", "new head");
  rmSync(join(f.cwd, ".git", "objects", parent.slice(0, 2), parent.slice(2)));
  assert.throws(
    () => checkSourceBaseline(f.cwd, f.policy),
    /无法验证 Git 证据/,
  );
});

test("Git command errors fail closed", (t) => {
  const cwd = mkdtempSync(join(tmpdir(), "goldcube-not-a-repo-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  assert.throws(() => checkSourceBaseline(cwd), /无法验证 Git 证据/);
});
