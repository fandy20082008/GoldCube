import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  checkReleaseGit,
  checkReleaseRecord,
} from "./check-goldcube-release.mjs";

const context = {
  tag: "goldcube-v0.0.7-custom.99",
  commit: "a".repeat(40),
  repository: "fandy20082008/GoldCube",
  component: "app",
  image: "ghcr.io/fandy20082008/goldcube",
};
const fixture = () => ({
  schemaVersion: 1,
  releaseTag: context.tag,
  workflowCommit: context.commit,
  applicationRepository: context.repository,
  sourceNotices: Object.fromEntries([[context.repository, context.commit], ["fandy20082008/GoldCube-Gateway", "b".repeat(40)]].map(([repository, commit]) => [repository, { licenseUrl: `https://github.com/${repository}/blob/${commit}/LICENSE`, noticesUrl: `https://github.com/${repository}/blob/${commit}/NOTICES.md`, buildUrl: `https://github.com/${repository}/blob/${commit}/README.md` }])),
  imageTargets: { app: context.image, docs: "ghcr.io/fandy20082008/docs" },
  components: Object.fromEntries(
    ["app", "frontend", "worker", "proxy", "docs"].map((role) => [
      role,
      {
        repository:
          role === "proxy"
            ? "fandy20082008/GoldCube-Gateway"
            : context.repository,
        commit: role === "proxy" ? "b".repeat(40) : context.commit,
        sourceArchive: {
          url: `https://fixture.invalid/sources/${role === "proxy" ? "proxy" : "app"}.tar.gz`,
          sha256: "c".repeat(64),
        },
        ...(role === "proxy"
          ? {
              releaseGate: {
                status: "passed",
                sourceCommit: "b".repeat(40),
                recordSha256: "d".repeat(64),
                reportUrl: "https://fixture.invalid/proxy-gate",
              },
            }
          : {}),
        review: {
          reviewer: "fixture-reviewer",
          reviewedAt: "2026-09-22T00:00:00Z",
          checks: Object.fromEntries(
            [
              "provenance",
              "secrets",
              "publicBuild",
              "sourceDownload",
              "sourceCompleteness",
            ].map((name) => [
              name,
              {
                status: "passed",
                evidence: `https://fixture.invalid/review/${role}/${name}`,
              },
            ]),
          ),
        },
      },
    ]),
  ),
  approval: {
    decision: "approved",
    reviewer: "fixture-manager",
    evidence: "https://fixture.invalid/release-review",
  },
});

test("complete externally reviewed record binds app and docs without making network calls", () => {
  assert.equal(checkReleaseRecord(fixture(), context).commit, context.commit);
  assert.equal(
    checkReleaseRecord(fixture(), {
      ...context,
      component: "docs",
      image: "ghcr.io/fandy20082008/docs",
    }).releaseTag,
    context.tag,
  );
});
test("public prebuild binds the independently trusted proof and both commits", () => {
  const record = fixture();
  const proofSha256 = "e".repeat(64);
  const publicContext = { ...context, sourceMode: "public-snapshot", proofSha256 };
  assert.throws(() => checkReleaseRecord(record, publicContext), /公开快照/);
  record.sourceSnapshot = {
    proofSha256,
    applicationCommit: context.commit,
    gatewayCommit: record.components.proxy.commit,
  };
  assert.equal(checkReleaseRecord(record, publicContext).deploymentReady, false);
  record.sourceSnapshot.gatewayCommit = "f".repeat(40);
  assert.throws(() => checkReleaseRecord(record, publicContext), /公开快照/);
  assert.throws(() => checkReleaseRecord(record, { ...context, sourceMode: "skip" }), /未知来源模式/);
});

const deploymentFixture = () => {
  const record = fixture();
  record.prebuildRecordSha256 = createHash("sha256")
    .update(JSON.stringify(fixture()))
    .digest("hex");
  record.artifacts = Object.fromEntries(
    [
      "app",
      "frontend",
      "worker",
      "proxy",
      "docs",
      "shell",
      "assets",
      "deployment",
    ].map((role) => {
      const gateway = ["proxy", "shell", "assets", "deployment"].includes(role);
      const source = record.components[gateway ? "proxy" : role];
      const digest = `sha256:${(gateway ? "e" : role === "docs" ? "f" : "d").repeat(64)}`;
      return [
        role,
        {
          repository: source.repository,
          sourceCommit: source.commit,
          sourceArchiveSha256: source.sourceArchive.sha256,
          digest,
          uri: gateway
            ? "https://fixture.invalid/gateway.tar.gz"
            : `${record.imageTargets[role === "docs" ? "docs" : "app"]}@${digest}`,
          verificationEvidence: `https://fixture.invalid/artifact-review/${role}`,
        },
      ];
    }),
  );
  record.deploymentApproval = { ...record.approval };
  return record;
};

const deploymentContext = () => ({
  ...context,
  phase: "deployment",
  prebuildRecordBytes: Buffer.from(JSON.stringify(fixture())),
});

test("prebuild does not claim deployment readiness; complete final manifest does", () => {
  assert.equal(checkReleaseRecord(fixture(), context).deploymentReady, false);
  assert.equal(
    checkReleaseRecord(deploymentFixture(), deploymentContext())
      .deploymentReady,
    true,
  );
});

for (const [name, change] of [
  [
    "missing all artifacts",
    (r) => {
      delete r.artifacts;
    },
  ],
  [
    "missing shell",
    (r) => {
      delete r.artifacts.shell;
    },
  ],
  [
    "extra unknown artifact",
    (r) => {
      r.artifacts.unknown = r.artifacts.app;
    },
  ],
  [
    "wrong gateway identity",
    (r) => {
      r.artifacts.proxy.repository = context.repository;
    },
  ],
  [
    "wrong source commit",
    (r) => {
      r.artifacts.worker.sourceCommit = "f".repeat(40);
    },
  ],
  [
    "wrong archive hash",
    (r) => {
      r.artifacts.assets.sourceArchiveSha256 = "f".repeat(64);
    },
  ],
  [
    "floating image",
    (r) => {
      r.artifacts.app.uri = `${context.image}:latest`;
    },
  ],
  [
    "zero digest",
    (r) => {
      r.artifacts.proxy.digest = `sha256:${"0".repeat(64)}`;
    },
  ],
  [
    "worker image mismatch",
    (r) => {
      r.artifacts.worker.digest = `sha256:${"f".repeat(64)}`;
      r.artifacts.worker.uri = `${context.image}@${r.artifacts.worker.digest}`;
    },
  ],
  [
    "missing artifact evidence",
    (r) => {
      delete r.artifacts.deployment.verificationEvidence;
    },
  ],
  [
    "missing deployment approval",
    (r) => {
      delete r.deploymentApproval;
    },
  ],
]) {
  test(`deployment blocks ${name}`, () => {
    const record = deploymentFixture();
    change(record);
    assert.throws(
      () => checkReleaseRecord(record, deploymentContext()),
      /发布阻断/,
    );
  });
}

test("deployment requires the exact raw prebuild bytes and hash", () => {
  const record = deploymentFixture();
  assert.throws(
    () => checkReleaseRecord(record, { ...context, phase: "deployment" }),
    /prebuild-record/,
  );
  const input = deploymentContext();
  input.prebuildRecordBytes = Buffer.concat([
    input.prebuildRecordBytes,
    Buffer.from("\n"),
  ]);
  assert.throws(() => checkReleaseRecord(record, input), /SHA-256 不匹配/);
});

test("deployment rejects internally consistent replacement of gateway commit and archive", () => {
  const record = deploymentFixture();
  const proxy = record.components.proxy;
  proxy.commit = "f".repeat(40);
  proxy.releaseGate.sourceCommit = proxy.commit;
  for (const key of ["licenseUrl", "noticesUrl", "buildUrl"]) record.sourceNotices[proxy.repository][key] = record.sourceNotices[proxy.repository][key].replace("b".repeat(40), proxy.commit);
  proxy.sourceArchive.sha256 = "e".repeat(64);
  for (const role of ["proxy", "shell", "assets", "deployment"]) {
    record.artifacts[role].sourceCommit = proxy.commit;
    record.artifacts[role].sourceArchiveSha256 = proxy.sourceArchive.sha256;
  }
  assert.throws(
    () => checkReleaseRecord(record, deploymentContext()),
    /最终清单与构建前记录不一致/,
  );
});

test("deployment preserves all other prebuild fields including review evidence", () => {
  const record = deploymentFixture();
  record.approval.evidence = "https://fixture.invalid/replaced-approval";
  assert.throws(
    () => checkReleaseRecord(record, deploymentContext()),
    /最终清单与构建前记录不一致/,
  );
});

test("rejects swapped mapping and inconsistent archives before build", () => {
  const record = fixture();
  record.components.proxy.repository = "fandy20082008/Unreviewed";
  assert.throws(() => checkReleaseRecord(record, context), /GoldCube-Gateway/);
  const swapped = { ...context, repository: "fandy20082008/GoldCube-Gateway" };
  assert.throws(() => checkReleaseRecord(fixture(), swapped), /应用仓库必须/);
  record.components.proxy.repository = "fandy20082008/GoldCube-Gateway";
  record.components.worker.sourceArchive.sha256 = "e".repeat(64);
  assert.throws(
    () => checkReleaseRecord(record, context),
    /同一应用完整源码归档/,
  );
  assert.throws(
    () => checkReleaseRecord(fixture(), { ...context, phase: "unknown" }),
    /未知发布验收阶段/,
  );
});

for (const [name, change] of [
  ["missing pinned license notices", (r) => { delete r.sourceNotices; }],
  ["floating license link", (r) => { r.sourceNotices[context.repository].licenseUrl = `https://github.com/${context.repository}/blob/main/LICENSE`; }],
  ["foreign license link", (r) => { r.sourceNotices[context.repository].licenseUrl = `https://example.invalid/${context.repository}/blob/${context.commit}/LICENSE`; }],
  [
    "legacy upstream tag",
    (r, c) => {
      c.tag = "v0.0.7";
    },
  ],
  [
    "empty target",
    (r, c) => {
      c.image = "";
    },
  ],
  [
    "inherited upstream target",
    (r, c) => {
      c.image = "ghcr.io/csyqlz/vozeb-pro";
    },
  ],
  [
    "different owner target",
    (r, c) => {
      c.image = "ghcr.io/other/application";
    },
  ],
  [
    "floating image tag",
    (r, c) => {
      c.image += ":latest";
    },
  ],
  [
    "record commit mismatch",
    (r) => {
      r.workflowCommit = "d".repeat(40);
    },
  ],
  [
    "record tag mismatch",
    (r) => {
      r.releaseTag = "goldcube-v0.0.7-custom.1";
    },
  ],
  [
    "record target mismatch",
    (r) => {
      r.imageTargets.app = "ghcr.io/fandy20082008/other";
    },
  ],
  [
    "worker from different commit",
    (r) => {
      r.components.worker.commit = "e".repeat(40);
    },
  ],
  [
    "missing independent proxy",
    (r) => {
      delete r.components.proxy;
    },
  ],
  [
    "proxy without separate repository",
    (r) => {
      r.components.proxy.repository = context.repository;
    },
  ],
  [
    "proxy without its own release check",
    (r) => {
      delete r.components.proxy.releaseGate;
    },
  ],
  [
    "proxy gate from different commit",
    (r) => {
      r.components.proxy.releaseGate.sourceCommit = "f".repeat(40);
    },
  ],
  [
    "source archive without hash",
    (r) => {
      delete r.components.proxy.sourceArchive.sha256;
    },
  ],
  [
    "credentials embedded in source URL",
    (r) => {
      r.components.app.sourceArchive.url =
        "https://secret:token@fixture.invalid/source";
    },
  ],
  [
    "unknown proxy provenance",
    (r) => {
      r.components.proxy.review.checks.provenance.status = "unknown";
    },
  ],
  [
    "missing public download evidence",
    (r) => {
      delete r.components.app.review.checks.sourceDownload.evidence;
    },
  ],
  [
    "missing reviewer",
    (r) => {
      r.components.docs.review.reviewer = "";
    },
  ],
  [
    "invalid review timestamp",
    (r) => {
      r.components.app.review.reviewedAt = "pending";
    },
  ],
  [
    "approval boolean only",
    (r) => {
      r.approval = true;
    },
  ],
]) {
  test(`blocks ${name}`, () => {
    const record = fixture();
    const input = { ...context };
    change(record, input);
    assert.throws(() => checkReleaseRecord(record, input), /发布阻断/);
  });
}

test("Git fixture rejects moved tags, differing workflow commit, tracked and untracked changes", () => {
  const cwd = mkdtempSync(join(tmpdir(), "goldcube-release-"));
  const git = (...args) => {
    const result = spawnSync("git", args, {
      cwd,
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_CONFIG_NOSYSTEM: "1",
        GIT_CONFIG_GLOBAL: process.platform === "win32" ? "NUL" : "/dev/null",
      },
    });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  try {
    git("init");
    git("config", "user.name", "Fixture");
    git("config", "user.email", "fixture@example.invalid");
    writeFileSync(join(cwd, "source.txt"), "first\n");
    git("add", "source.txt");
    git("commit", "-m", "fixture");
    const commit = git("rev-parse", "HEAD");
    git("tag", context.tag);
    const input = { ...context, commit };
    checkReleaseGit(cwd, input);
    assert.throws(
      () => checkReleaseGit(cwd, { ...input, commit: context.commit }),
      /候选 commit/,
    );
    writeFileSync(join(cwd, "source.txt"), "second\n");
    assert.throws(() => checkReleaseGit(cwd, input), /工作区必须干净/);
    git("add", "source.txt");
    git("commit", "-m", "second");
    assert.throws(
      () =>
        checkReleaseGit(cwd, { ...input, commit: git("rev-parse", "HEAD") }),
      /精确发布标签/,
    );
    git("tag", "-f", context.tag);
    input.commit = git("rev-parse", "HEAD");
    writeFileSync(join(cwd, "untracked.txt"), "unreviewed\n");
    assert.throws(() => checkReleaseGit(cwd, input), /工作区必须干净/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("CLI cannot proceed without an external acceptance record", () => {
  const result = spawnSync(
    process.execPath,
    [fileURLToPath(new URL("./check-goldcube-release.mjs", import.meta.url))],
    { encoding: "utf8", env: { ...process.env, GOLDCUBE_RELEASE_RECORD: "" } },
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /必须提供外置 JSON/);
});

for (const filename of ["docker-image.yml", "docs-docker-image.yml"]) {
  test(`${filename} only permits the exact controlled manual candidate`, () => {
    const body = readFileSync(
      new URL(`../.github/workflows/${filename}`, import.meta.url),
      "utf8",
    );
    assert.match(body, /on:\r?\n  workflow_dispatch:/);
    assert.doesNotMatch(body, /^  push:/m);
    assert.doesNotMatch(
      body,
      /ghcr\.io\/csyqlz|value=latest|type=ref,event=tag/,
    );
    assert.match(body, /--tag "\$RELEASE_TAG" --commit "\$WORKFLOW_COMMIT"/);
    assert.match(
      body,
      /GOLDCUBE_RELEASE_RECORD: \$\{\{ inputs.acceptance_record \}\}/,
    );
    for (const block of body
      .split(/(?=      - (?:uses: actions\/checkout|name: Checkout))/)
      .filter((s) => s.includes("uses: actions/checkout"))) {
      assert.match(block, /ref: \$\{\{ github.sha \}\}/);
    }
    assert.match(body, /build:\r?\n    needs:\r?\n      - release-gate/);
  });
}
