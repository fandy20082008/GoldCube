import { jsonrepair } from "jsonrepair";

export function strictJsonObjectText(value: unknown) {
    if (typeof value !== "string") return "";
    const text = value.trim();
    const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)?.[1]?.trim() || "";
    return parseObjectText(text) || parseObjectText(fenced);
}

export function extractJsonObjectText(value: unknown) {
    if (typeof value !== "string") return "";
    const text = value.trim();
    const strict = strictJsonObjectText(text);
    if (strict) return strict;
    for (let start = 0; start < text.length; start += 1) {
        if (text[start] !== "{") continue;
        const end = jsonObjectEnd(text, start);
        // A truncated outer object must never promote a complete nested object
        // to the requested root. Repair only that outer candidate.
        if (end === -1) return repairObjectText(text.slice(start));
        const candidate = text.slice(start, end + 1);
        const parsed = parseObjectText(candidate) || repairObjectText(candidate);
        if (parsed) return parsed;
        start = end;
    }
    return "";
}

export function hasIncompleteJsonObject(value: string) {
    const start = value.indexOf("{");
    return start !== -1 && jsonObjectEnd(value, start) === -1;
}

function jsonObjectEnd(text: string, start: number) {
    let depth = 0;
    let escaped = false;
    let inString = false;
    for (let index = start; index < text.length; index += 1) {
        const character = text[index];
        if (escaped) {
            escaped = false;
            continue;
        }
        if (character === "\\" && inString) {
            escaped = true;
            continue;
        }
        if (character === '"') inString = !inString;
        if (inString) continue;
        if (character === "{") depth += 1;
        if (character === "}" && --depth === 0) return index;
    }
    return -1;
}

function parseObjectText(value: string) {
    if (!value.startsWith("{") || !value.endsWith("}")) return "";
    try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? value : "";
    } catch {
        return "";
    }
}

function repairObjectText(value: string) {
    if (!value.startsWith("{")) return "";
    try {
        const repaired = jsonrepair(value);
        const parsed = JSON.parse(repaired);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? repaired : "";
    } catch {
        return "";
    }
}
