import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkSourceBaseline } from "./check-source-baseline.mjs";
import { checkPublicSnapshot } from "./check-public-snapshot.mjs";

export function checkSourceProvenance(cwd, env = process.env) {
  const mode = env.GOLDCUBE_SOURCE_MODE || "private-history";
  if (mode === "private-history") return checkSourceBaseline(cwd);
  if (mode !== "public-snapshot") throw new Error("来源门禁失败：未知来源模式。");
  const proofBytes = Buffer.from(env.GOLDCUBE_SNAPSHOT_PROOF || "", "utf8");
  return checkPublicSnapshot({
    cwd,
    component: "application",
    proofBytes,
    trustedSha256: env.GOLDCUBE_SNAPSHOT_PROOF_SHA256,
    expectedCommit: env.GITHUB_SHA || env.GOLDCUBE_SNAPSHOT_COMMIT,
    expectedRepository: env.GITHUB_REPOSITORY || "fandy20082008/GoldCube",
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log(JSON.stringify(checkSourceProvenance(process.cwd()), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
