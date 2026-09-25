import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { appName, gitConfig } from "./shared";
import { ArrowUpRight, GitBranch, Users } from "lucide-react";

const githubUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;
const upstreamCommunityUrl =
  "https://github.com/csyqlz/VOZEB-PRO/blob/04b32d31ca00272e3866c85e9a8329036c63af72/docs/content/docs/support/community.mdx";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="inline-flex items-center gap-2 font-semibold">
          <img src="/logo.svg" alt={appName} className="h-6 w-6" />
          <span>{appName}</span>
        </span>
      ),
    },
    links: [
      {
        text: "文档导航",
        url: "/docs/overview/quick-start",
        on: "nav",
      },
      {
        text: (
          <span className="inline-flex items-center gap-1.5">
            <span>项目仓库</span>
            <ArrowUpRight className="size-4" />
          </span>
        ),
        url: githubUrl,
        external: true,
        on: "nav",
      },
      {
        type: "icon",
        text: "GitHub",
        label: "GitHub",
        url: githubUrl,
        external: true,
        on: "menu",
        icon: <GitBranch className="size-4" />,
      },
      {
        type: "icon",
        text: "上游社区文档",
        label: "原作者社区文档（上游旧 AGPL 基线）",
        url: upstreamCommunityUrl,
        external: true,
        on: "menu",
        icon: <Users className="size-4" />,
      },
    ],
  };
}
