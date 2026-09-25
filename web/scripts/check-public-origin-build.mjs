import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const chunksRoot = path.join(webRoot, process.env.NEXT_DIST_DIR || ".next", "server", "chunks");
let checked = 0;

for (const name of await readdir(chunksRoot)) {
    if (!name.endsWith(".js")) continue;
    const source = await readFile(path.join(chunksRoot, name), "utf8");
    if (!source.includes('"resolvePublicRequestOrigin"')) continue;
    const environment = { NEXT_PUBLIC_SITE_URL: "https://runtime-one.example" };
    const context = { module: { exports: [] }, process: { env: environment }, URL };
    vm.runInNewContext(source, context, { filename: name });
    for (const factory of context.module.exports) {
        if (typeof factory !== "function" || !factory.toString().includes('"resolvePublicRequestOrigin"')) continue;
        const exports = {};
        factory({
            i: () => ({ getTrustedProxyHops: () => 0 }),
            s: (items) => {
                for (let index = 0; index < items.length; index += 3) exports[items[index]] = items[index + 2];
            },
        });
        const request = new Request("http://127.0.0.1:3000/api/video-generation-tasks");
        for (const origin of ["https://runtime-one.example", "https://runtime-two.example"]) {
            environment.NEXT_PUBLIC_SITE_URL = origin;
            assert.equal(exports.resolvePublicRequestOrigin(request), origin, `${name}: deployment URL was frozen during build`);
        }
        checked += 1;
    }
}

assert.ok(checked > 0, "No compiled public-origin resolver found; review the production bundle format");
console.log(`Verified runtime public origin in ${checked} production modules`);
