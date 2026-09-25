import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const prefixes = ["vozeb-pro/original-author-prompts", "tigerowo/awesome-gpt-image-2-prompts"];
const [, , action, ...args] = process.argv;
const flags = new Map();
for (let index = 0; index < args.length; index += 2) flags.set(args[index], args[index + 1]);

if (!["inventory", "apply", "rollback"].includes(action) || !["file", "pg"].includes(flags.get("--provider")) || !flags.get("--evidence")) {
    throw new Error("Usage: node scripts/retire-managed-prompt-library.mjs inventory|apply|rollback --provider file|pg --evidence PRIVATE_DIR [--file ABSOLUTE_PROMPTS_JSON]");
}
const provider = flags.get("--provider");
if (!isAbsolute(flags.get("--evidence"))) throw new Error("Evidence directory must be an absolute private path");
const evidence = resolve(flags.get("--evidence"));
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const repositoryRelative = relative(repositoryRoot, evidence);
if (!repositoryRelative.startsWith("..") && !isAbsolute(repositoryRelative)) throw new Error("Evidence directory must be outside the source repository");
const file = flags.get("--file");
if (provider === "file" && (!file || !isAbsolute(file) || !resolve(file).toLowerCase().endsWith("prompts.json"))) throw new Error("File provider requires --file ABSOLUTE_PROMPTS_JSON");
if (provider === "pg" && !process.env.PROMPT_MIGRATION_DATABASE_URL) throw new Error("PG provider requires PROMPT_MIGRATION_DATABASE_URL");
const planPath = resolve(evidence, "plan.json");
const originalPath = resolve(evidence, "original-prompts.json");
const markerPath = resolve(evidence, "applied.json");
const exists = async (path) => stat(path).then(() => true, () => false);
const isManaged = (source) => typeof source === "string" && prefixes.some((prefix) => source === prefix || source.startsWith(`${prefix}:`));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const asIdentity = (prompt) => ({ id: String(prompt.id), source: prompt.source });
const managedPrompts = (prompts) => prompts.filter((prompt) => prompt.scope === "library" && isManaged(prompt.source)).sort((a, b) => String(a.id).localeCompare(String(b.id)));
const managedSources = (sources) => sources.filter((source) => isManaged(typeof source === "string" ? source : source.source)).sort((a, b) => String(typeof a === "string" ? a : a.source).localeCompare(String(typeof b === "string" ? b : b.source)));
const identities = (prompts) => managedPrompts(prompts).map(asIdentity).sort((a, b) => a.id.localeCompare(b.id));
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const writePrivate = async (path, value) => {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, value, { encoding: "utf8", flag: "wx", mode: 0o600 });
};
const readPlan = async () => {
    const plan = JSON.parse(await readFile(planPath, "utf8"));
    if (plan.provider !== provider || !Array.isArray(plan.identities) || !Array.isArray(plan.seedSources)) throw new Error("Evidence provider or plan is invalid");
    return plan;
};
const atomicFileWrite = async (path, bytes) => {
    const temporary = `${path}.${randomUUID()}.tmp`;
    await writeFile(temporary, bytes, { flag: "wx" });
    await rename(temporary, path);
};

if (provider === "file") {
    const filePath = resolve(file);
    const bytes = await readFile(filePath);
    const data = JSON.parse(bytes.toString("utf8"));
    if (!Array.isArray(data.prompts) || !Array.isArray(data.seedSources)) throw new Error("Invalid prompts.json schema");
    if (action === "inventory") {
        const plan = {
            provider, file: filePath, originalSha256: sha256(bytes), total: data.prompts.length,
            identities: identities(data.prompts), seedSources: managedSources(data.seedSources),
            personalCount: data.prompts.filter((prompt) => prompt.scope === "user").length,
        };
        await writePrivate(originalPath, bytes);
        await writePrivate(planPath, `${JSON.stringify(plan, null, 2)}\n`);
        console.log(JSON.stringify({ total: plan.total, managed: plan.identities.length, personal: plan.personalCount, sources: plan.seedSources.length, plan: planPath }));
    } else if (action === "apply") {
        const plan = await readPlan();
        if (await exists(markerPath)) throw new Error("Migration has already been applied");
        if (plan.file !== filePath || plan.originalSha256 !== sha256(bytes) || !same(plan.identities, identities(data.prompts))) throw new Error("File changed since inventory; create a new private plan");
        const original = await readFile(originalPath);
        if (sha256(original) !== plan.originalSha256) throw new Error("Backup checksum mismatch");
        const next = {
            ...data,
            prompts: data.prompts.filter((prompt) => !(prompt.scope === "library" && isManaged(prompt.source))),
            seedSources: data.seedSources.filter((source) => !isManaged(source)),
        };
        const nextBytes = Buffer.from(`${JSON.stringify(next, null, 2)}\n`);
        await atomicFileWrite(filePath, nextBytes);
        await writePrivate(markerPath, `${JSON.stringify({ originalSha256: plan.originalSha256, appliedSha256: sha256(nextBytes) }, null, 2)}\n`);
        console.log(JSON.stringify({ removed: plan.identities.length, appliedSha256: sha256(nextBytes) }));
    } else {
        const plan = await readPlan();
        const marker = JSON.parse(await readFile(markerPath, "utf8"));
        const original = await readFile(originalPath);
        if (plan.file !== filePath || marker.appliedSha256 !== sha256(bytes) || plan.originalSha256 !== sha256(original)) throw new Error("Data changed or backup checksum mismatch; do not overwrite later edits");
        await atomicFileWrite(filePath, original);
        console.log(JSON.stringify({ restored: plan.identities.length, sha256: sha256(original) }));
    }
} else {
    const { default: pg } = await import("pg");
    const client = new pg.Client({ connectionString: process.env.PROMPT_MIGRATION_DATABASE_URL });
    await client.connect();
    try {
        if (action === "inventory") {
            await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
            const prompts = (await client.query("SELECT * FROM prompts ORDER BY id")).rows;
            const sources = (await client.query("SELECT * FROM prompt_seed_sources ORDER BY source")).rows;
            await client.query("COMMIT");
            const selected = managedPrompts(prompts);
            const plan = {
                provider, identities: identities(prompts), seedSources: managedSources(sources).map((row) => row.source),
                total: prompts.length, personalCount: prompts.filter((prompt) => prompt.scope === "user").length,
                selectedSha256: sha256(JSON.stringify(selected)),
            };
            await writePrivate(originalPath, `${JSON.stringify({ prompts: selected, seedSources: managedSources(sources) }, null, 2)}\n`);
            await writePrivate(planPath, `${JSON.stringify(plan, null, 2)}\n`);
            console.log(JSON.stringify({ total: plan.total, managed: plan.identities.length, personal: plan.personalCount, sources: plan.seedSources.length, plan: planPath }));
        } else {
            const plan = await readPlan();
            const backup = JSON.parse(await readFile(originalPath, "utf8"));
            if (!same(plan.identities, identities(backup.prompts)) || sha256(JSON.stringify(backup.prompts)) !== plan.selectedSha256) throw new Error("Backup contents do not match plan");
            if (action === "apply" && await exists(markerPath)) throw new Error("Migration has already been applied");
            if (action === "rollback" && !await exists(markerPath)) throw new Error("No applied migration marker");
            await client.query("BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE");
            try {
                const current = (await client.query("SELECT * FROM prompts WHERE scope = 'library' FOR UPDATE")).rows;
                const sources = (await client.query("SELECT * FROM prompt_seed_sources FOR UPDATE")).rows;
                if (action === "apply") {
                    if (!same(plan.identities, identities(current)) || !same(plan.seedSources, managedSources(sources).map((row) => row.source)) || sha256(JSON.stringify(managedPrompts(current))) !== plan.selectedSha256) throw new Error("Managed rows changed since inventory");
                    for (const item of plan.identities) await client.query("DELETE FROM prompts WHERE id = $1 AND scope = 'library' AND source = $2", [item.id, item.source]);
                    for (const source of plan.seedSources) await client.query("DELETE FROM prompt_seed_sources WHERE source = $1", [source]);
                } else {
                    const existingIds = new Set((await client.query("SELECT id FROM prompts FOR UPDATE")).rows.map((row) => row.id));
                    if (plan.identities.some((item) => existingIds.has(item.id)) || managedSources(sources).length) throw new Error("Managed rows or ID collisions exist; do not overwrite later edits");
                    for (const source of backup.seedSources) await client.query("INSERT INTO prompt_seed_sources (source, imported_at) VALUES ($1, $2)", [source.source, source.imported_at]);
                    for (const row of backup.prompts) {
                        await client.query(
                            "INSERT INTO prompts (id, scope, owner_user_id, title, cover_url, prompt, tags, category, preview, github_url, source, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)",
                            [row.id, row.scope, row.owner_user_id, row.title, row.cover_url, row.prompt, row.tags, row.category, row.preview, row.github_url, row.source, row.created_at, row.updated_at],
                        );
                    }
                }
                await client.query("COMMIT");
                if (action === "apply") await writePrivate(markerPath, `${JSON.stringify({ provider, selectedSha256: plan.selectedSha256, count: plan.identities.length })}\n`);
                console.log(JSON.stringify({ action, count: plan.identities.length }));
            } catch (error) {
                await client.query("ROLLBACK");
                throw error;
            }
        }
    } finally {
        await client.end();
    }
}
