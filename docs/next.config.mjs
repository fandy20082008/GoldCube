import { createMDX } from "fumadocs-mdx/next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const withMDX = createMDX();
const docsRoot = dirname(fileURLToPath(import.meta.url));
const configuredBuildCpus = Number.parseInt(
  process.env.NEXT_BUILD_CPUS || "",
  10,
);

/** @type {import('next').NextConfig} */
const config = {
  output: "standalone",
  outputFileTracingRoot: docsRoot,
  turbopack: { root: docsRoot },
  reactStrictMode: true,
  ...(Number.isSafeInteger(configuredBuildCpus) && configuredBuildCpus > 0
    ? { experimental: { cpus: configuredBuildCpus } }
    : {}),
  async rewrites() {
    return {
      beforeFiles: [{ source: "/favicon.ico", destination: "/api/site-icon" }],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default withMDX(config);
