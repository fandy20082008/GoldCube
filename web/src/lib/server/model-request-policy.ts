import type { LogicalModelCapability, LogicalModelCapabilityProfile } from "@/lib/auth/store";

const MIN_REQUEST_TIMEOUT_MS = 5_000;
const MAX_REQUEST_TIMEOUT_MS = 30 * 60_000;
export const TEXT_MODEL_REQUEST_TIMEOUT_MS = 10 * 60_000;
export const VIDEO_MODEL_REQUEST_TIMEOUT_MS = 30 * 60_000;

export const DEFAULT_MODEL_REQUEST_TIMEOUT_MS: Record<LogicalModelCapability, number> = {
    text: TEXT_MODEL_REQUEST_TIMEOUT_MS,
    image: 10 * 60_000,
    video: VIDEO_MODEL_REQUEST_TIMEOUT_MS,
    audio: 3 * 60_000,
};

type ModelRequestPolicyConfig = { capabilityProfile?: Pick<LogicalModelCapabilityProfile, "timeoutMs"> };

export function resolveModelRequestTimeoutMs(config: ModelRequestPolicyConfig | undefined, capability: LogicalModelCapability) {
    if (capability === "video") return VIDEO_MODEL_REQUEST_TIMEOUT_MS;
    const configured = Math.floor(Number(config?.capabilityProfile?.timeoutMs));
    if (!Number.isFinite(configured) || configured <= 0) return DEFAULT_MODEL_REQUEST_TIMEOUT_MS[capability];
    const maximum = capability === "text" ? TEXT_MODEL_REQUEST_TIMEOUT_MS : MAX_REQUEST_TIMEOUT_MS;
    return Math.max(MIN_REQUEST_TIMEOUT_MS, Math.min(maximum, configured));
}

export function resolveModelPollingAttempts(config: ModelRequestPolicyConfig | undefined, capability: LogicalModelCapability, intervalMs: number, minimumAttempts: number) {
    return Math.max(minimumAttempts, Math.ceil(resolveModelRequestTimeoutMs(config, capability) / intervalMs));
}
