"use client";

import { Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import type { CreativeMessage } from "@/lib/creative-runtime-contract";
import type { CreativeAgentRun } from "@/services/api/creative";

import { creativeRunMode } from "./creative-run-presentation";

const LONG_WAIT_MESSAGES = ["主人，久等了，辛苦你再陪我一会儿，我一直在这里守着这次创作。", "主人，别担心，创作还在继续，不用重复发送，先放松一下，这里交给我守着吧。", "主人，作品正在慢慢雕琢，可能比平时久一点，但我没有离开。"] as const;

export function CreativeGenerationWaiting({ run, message }: { run?: CreativeAgentRun; message: Pick<CreativeMessage, "content" | "createdAt"> }) {
    const startedAt = run?.createdAt || message.createdAt;
    const [now, setNow] = useState(() => Date.now());
    const mode = creativeRunMode(run);

    useEffect(() => {
        const update = () => setNow(Date.now());
        update();
        const timer = window.setInterval(update, 1000);
        return () => window.clearInterval(timer);
    }, [startedAt]);

    const elapsedSeconds = Math.max(0, Math.floor((now - startedAt) / 1000));
    const copy = creativeGenerationWaitingCopy({ mode, runStatus: run?.status, progressText: message.content, elapsedSeconds });

    return (
        <div data-testid="creative-generation-waiting" className="mb-3 max-w-[520px] py-1 text-[#667085] dark:text-[#a0a9b4]">
            <div className="flex items-start gap-2.5">
                <Sparkles className="mt-1 size-4 shrink-0 text-primary/75 motion-safe:animate-pulse" aria-hidden />
                <div className="min-w-0">
                    <p className="text-sm leading-6 text-[#596474] dark:text-[#b0b8c2]" aria-live="polite">
                        {copy}
                    </p>
                    <p data-testid="creative-generation-elapsed" className="mt-0.5 text-[11px] tabular-nums leading-4 text-[#98a2b3] dark:text-[#7f8996]">
                        已等待 {formatCreativeWaitingTime(elapsedSeconds)}
                    </p>
                </div>
            </div>
            {shouldShowCreativeMediaWaiting(mode, run?.status) ? <CreativeMediaWaitingVisual mode={mode} /> : null}
        </div>
    );
}

function CreativeMediaWaitingVisual({ mode }: { mode: "image" | "video" }) {
    const reduceMotion = useReducedMotion();
    const animation = (values: { x: string[]; y: string[]; rotate: number[]; scale: number[]; opacity: number[] }, duration: number) => ({
        animate: reduceMotion ? { x: "0%", y: "0%", rotate: 0, scale: 1, opacity: values.opacity[0] } : values,
        transition: reduceMotion ? { duration: 0 } : { duration, ease: "easeInOut" as const, repeat: Infinity, repeatType: "mirror" as const },
    });

    return (
        <div
            data-testid="creative-media-waiting-visual"
            data-media-mode={mode}
            role="img"
            aria-label={`${mode === "image" ? "图片" : "视频"}生成等待动画`}
            className="relative mt-3 aspect-video w-full max-w-[520px] isolate overflow-hidden rounded-[8px] border border-[#dde1e8] bg-[#e8ebf1] dark:border-[#303640] dark:bg-[#171b22]"
        >
            <motion.span
                aria-hidden
                className="absolute -left-[24%] -top-[42%] h-[128%] w-[94%] rounded-full bg-[radial-gradient(circle,rgba(145,127,255,0.62)_0%,rgba(145,127,255,0.2)_48%,transparent_72%)] blur-2xl will-change-transform dark:bg-[radial-gradient(circle,rgba(128,105,255,0.52)_0%,rgba(128,105,255,0.16)_50%,transparent_74%)]"
                {...animation({ x: ["0%", "22%", "7%"], y: ["0%", "16%", "31%"], rotate: [-9, 16, 3], scale: [1, 1.14, 0.98], opacity: [0.78, 0.94, 0.72] }, 9.5)}
            />
            <motion.span
                aria-hidden
                className="absolute -bottom-[48%] left-[20%] h-[126%] w-[100%] rounded-full bg-[radial-gradient(circle,rgba(54,186,207,0.58)_0%,rgba(54,186,207,0.18)_48%,transparent_72%)] blur-2xl will-change-transform dark:bg-[radial-gradient(circle,rgba(35,162,189,0.48)_0%,rgba(35,162,189,0.14)_50%,transparent_74%)]"
                {...animation({ x: ["0%", "20%", "-9%"], y: ["0%", "-22%", "-8%"], rotate: [8, -18, 11], scale: [1.05, 0.92, 1.16], opacity: [0.72, 0.92, 0.76] }, 11.5)}
            />
            <motion.span
                aria-hidden
                className="absolute -right-[32%] -top-[18%] h-[112%] w-[86%] rounded-full bg-[radial-gradient(circle,rgba(239,151,169,0.56)_0%,rgba(239,151,169,0.16)_48%,transparent_72%)] blur-2xl will-change-transform dark:bg-[radial-gradient(circle,rgba(205,104,145,0.42)_0%,rgba(205,104,145,0.13)_50%,transparent_74%)]"
                {...animation({ x: ["0%", "-25%", "-11%"], y: ["0%", "21%", "-6%"], rotate: [12, -13, 20], scale: [0.96, 1.14, 1.02], opacity: [0.66, 0.86, 0.7] }, 13.5)}
            />
            <div aria-hidden className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.28),transparent_48%,rgba(20,24,31,0.08))] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_48%,rgba(0,0,0,0.18))]" />
            <div
                aria-hidden
                className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md border border-white/40 bg-white/45 px-2 py-1 text-[11px] font-medium text-[#586170] shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-black/20 dark:text-[#c0c7d0]"
            >
                <span className="size-1.5 rounded-full bg-[#7772f6] motion-safe:animate-pulse dark:bg-[#a49cff]" />
                {mode === "image" ? "图片生成中" : "视频生成中"}
            </div>
        </div>
    );
}

export function shouldShowCreativeMediaWaiting(mode: "text" | "image" | "video" | "audio" | undefined, runStatus: CreativeAgentRun["status"] | undefined): mode is "image" | "video" {
    return (mode === "image" || mode === "video") && (runStatus === "planning" || runStatus === "running");
}

export function creativeGenerationWaitingCopy({ mode, runStatus, progressText, elapsedSeconds }: { mode?: "text" | "image" | "video" | "audio"; runStatus?: CreativeAgentRun["status"]; progressText: string; elapsedSeconds: number }) {
    const progress = progressText.trim();
    if (runStatus === "paused" || /任务已暂停/.test(progress)) return "主人，任务已经替你暂停，进度好好保存着，想继续时叫我就好。";
    if (/连接暂时中断|无法确认实时状态/.test(progress)) return "主人，连接刚刚有些不稳，不过任务仍在后台继续，我正在替你确认。";
    if (/连接已恢复|恢复连接/.test(progress)) return "主人，连接恢复啦，我会继续守着这次创作。";
    if (/检查完成|正在整理|创作结果/.test(progress)) return "主人，作品已经生成，我正在整理最后的细节，很快就能交到你手上。";

    const activeTask = /正在处理|上游处理中|创作任务|重新生成|正在优化/.test(progress);
    if (!activeTask && (runStatus === "planning" || /理解需求|匹配创作技能|方案已确定|创建任务/.test(progress))) return planningCopy(mode);

    const elapsedMinutes = Math.floor(Math.max(0, elapsedSeconds) / 60);
    if (elapsedMinutes === 0) {
        if (mode === "image") return "主人，画面正在一点点显现，再给我一点点时间呀。";
        if (mode === "video") return "主人，镜头正在一帧帧铺开，我会在这里陪你等着。";
        if (mode === "audio") return "主人，声音正在一点点成形，我会替你仔细听好。";
        return "主人，灵感已经接住啦，我正在把它变成作品。";
    }
    if (elapsedMinutes === 1) return longWaitCopy(mode, false);
    return longWaitCopy(mode, true, LONG_WAIT_MESSAGES[(elapsedMinutes - 2) % LONG_WAIT_MESSAGES.length]);
}

function planningCopy(mode?: "text" | "image" | "video" | "audio") {
    if (mode === "image") return "主人，我接住你的灵感啦，正在把画面的氛围和细节安排好。";
    if (mode === "video") return "主人，我已经抓住这个镜头啦，正在把节奏和画面串起来。";
    if (mode === "audio") return "主人，我先替你把声音的语气和节奏调到合适。";
    return "主人，我先帮你把想法理顺，很快就给你一版好内容。";
}

function longWaitCopy(mode: "text" | "image" | "video" | "audio" | undefined, veryLong: boolean, fallback: string = "") {
    if (veryLong) {
        if (mode === "image") return "主人，画面还在细细打磨，不用重复发送，我会替你稳稳守着。";
        if (mode === "video") return "主人，久等了，镜头还在一帧帧渲染，不用重复发送，我会替你稳稳守着。";
        if (mode === "audio") return "主人，声音还在细细校准，不用重复发送，我会替你稳稳守着。";
        return fallback;
    }
    if (mode === "image") return "主人，画面还在认真打磨，马上就把好看的细节交给你。";
    if (mode === "video") return "主人，镜头还在慢慢铺开，再陪我一会儿，很快就好。";
    if (mode === "audio") return "主人，声音还在细细调校，再陪我一会儿，很快就好。";
    return "主人，文字还在认真打磨，再陪我一会儿，很快就好。";
}

export function formatCreativeWaitingTime(elapsedSeconds: number) {
    const totalSeconds = Math.max(0, Math.floor(elapsedSeconds));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours) return `${hours}小时${minutes ? `${minutes}分` : ""}${seconds ? `${seconds}秒` : ""}`;
    if (minutes) return `${minutes}分${seconds ? `${seconds}秒` : ""}`;
    return `${seconds}秒`;
}
