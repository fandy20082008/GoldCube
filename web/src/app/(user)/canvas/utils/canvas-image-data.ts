"use client";

import type { CanvasImageLayerBox } from "@/lib/canvas-image-decomposition";

type ImageCropRect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type CanvasImageEditChange = {
    editedPixels: number;
    changedPixels: number;
    changedRatio: number;
    meanAbsoluteDifference: number;
};

export type ImageUpscaleAlgorithm = "nearest" | "bilinear" | "high";

export const MAX_UPSCALE_LONG_EDGE = 4096;

export function resolveCanvasImageDecompositionSource(input: { content?: string; serverUrl?: string; remoteUrl?: string }) {
    return input.serverUrl?.trim() || input.remoteUrl?.trim() || input.content?.trim() || "";
}

export type ImageUpscaleParams = {
    targetLongEdge: number;
    algorithm: ImageUpscaleAlgorithm;
};

export type ImageSplitParams = {
    rows: number;
    columns: number;
};

type ImageSplitPiece = {
    row: number;
    column: number;
    dataUrl: string;
};

export async function cropDataUrl(dataUrl: string, crop?: ImageCropRect) {
    const image = await loadImage(dataUrl);
    if (crop) {
        return drawCrop(image, Math.floor(crop.x * image.width), Math.floor(crop.y * image.height), Math.ceil(crop.width * image.width), Math.ceil(crop.height * image.height));
    }
    const size = Math.min(image.width, image.height);
    const sx = Math.max(0, Math.floor((image.width - size) / 2));
    const sy = Math.max(0, Math.floor((image.height - size) / 2));
    return drawCrop(image, sx, sy, size, size);
}

export async function splitDataUrl(dataUrl: string, params: ImageSplitParams): Promise<ImageSplitPiece[]> {
    const image = await loadImage(dataUrl);
    const rows = Math.max(1, Math.floor(params.rows));
    const columns = Math.max(1, Math.floor(params.columns));
    const pieces: ImageSplitPiece[] = [];

    for (let row = 0; row < rows; row += 1) {
        const sy = Math.floor((row * image.height) / rows);
        const sh = Math.floor(((row + 1) * image.height) / rows) - sy;
        for (let column = 0; column < columns; column += 1) {
            const sx = Math.floor((column * image.width) / columns);
            const sw = Math.floor(((column + 1) * image.width) / columns) - sx;
            pieces.push({ row, column, dataUrl: drawCrop(image, sx, sy, sw, sh) });
        }
    }

    return pieces;
}

export async function compositeCanvasImageEditResult(sourceUrl: string, generatedUrl: string, editMaskUrl: string, validationMaskUrl?: string) {
    const [sourceImage, generatedImage, maskImage, validationMaskImage] = await Promise.all([loadImage(sourceUrl), loadImage(generatedUrl), loadImage(editMaskUrl), validationMaskUrl ? loadImage(validationMaskUrl) : undefined]);
    const width = sourceImage.width;
    const height = sourceImage.height;
    const source = drawImageData(sourceImage, width, height);
    const generated = drawImageData(generatedImage, width, height);
    const mask = drawImageData(maskImage, width, height);
    const validationMask = validationMaskImage ? drawImageData(validationMaskImage, width, height) : mask;
    assertCanvasImageEditChanged(source, generated, validationMask);
    const composite = compositeImageDataWithinMask(source, generated, mask);
    return imageDataBlob(composite.data, width, height);
}

export function measureCanvasImageEditChange(source: Pick<ImageData, "data" | "width" | "height">, generated: Pick<ImageData, "data" | "width" | "height">, editMask: Pick<ImageData, "data" | "width" | "height">): CanvasImageEditChange {
    const expectedLength = source.width * source.height * 4;
    if (source.width < 1 || source.height < 1 || source.data.length !== expectedLength) throw new Error("源图片像素数据无效");
    if (generated.width !== source.width || generated.height !== source.height || generated.data.length !== expectedLength) throw new Error("背景补全结果尺寸无效");
    if (editMask.width !== source.width || editMask.height !== source.height || editMask.data.length !== expectedLength) throw new Error("背景补全蒙版尺寸无效");
    let editedPixels = 0;
    let changedPixels = 0;
    let difference = 0;
    for (let offset = 0; offset < expectedLength; offset += 4) {
        if (editMask.data[offset + 3] >= 128) continue;
        editedPixels += 1;
        const pixelDifference = Math.abs(source.data[offset] - generated.data[offset]) + Math.abs(source.data[offset + 1] - generated.data[offset + 1]) + Math.abs(source.data[offset + 2] - generated.data[offset + 2]);
        difference += pixelDifference;
        if (pixelDifference >= 24) changedPixels += 1;
    }
    return {
        editedPixels,
        changedPixels,
        changedRatio: editedPixels ? changedPixels / editedPixels : 0,
        meanAbsoluteDifference: editedPixels ? difference / (editedPixels * 3) : 0,
    };
}

export function assertCanvasImageEditChanged(source: Pick<ImageData, "data" | "width" | "height">, generated: Pick<ImageData, "data" | "width" | "height">, editMask: Pick<ImageData, "data" | "width" | "height">) {
    const change = measureCanvasImageEditChange(source, generated, editMask);
    if (!change.editedPixels) throw new Error("背景补全蒙版没有可编辑区域");
    if (change.changedRatio < 0.08 || change.meanAbsoluteDifference < 4) throw new Error("背景补全未清除原有元素，请重试分层");
    return change;
}

export function compositeImageDataWithinMask(source: Pick<ImageData, "data" | "width" | "height">, generated: Pick<ImageData, "data" | "width" | "height">, editMask: Pick<ImageData, "data" | "width" | "height">) {
    const expectedLength = source.width * source.height * 4;
    if (source.width < 1 || source.height < 1 || source.data.length !== expectedLength) throw new Error("源图片像素数据无效");
    if (generated.width !== source.width || generated.height !== source.height || generated.data.length !== expectedLength) throw new Error("背景补全结果尺寸无效");
    if (editMask.width !== source.width || editMask.height !== source.height || editMask.data.length !== expectedLength) throw new Error("背景补全蒙版尺寸无效");
    const data = new Uint8ClampedArray(expectedLength);
    for (let offset = 0; offset < expectedLength; offset += 4) {
        const preserveWeight = editMask.data[offset + 3] / 255;
        const editWeight = 1 - preserveWeight;
        for (let channel = 0; channel < 4; channel += 1) data[offset + channel] = Math.round(source.data[offset + channel] * preserveWeight + generated.data[offset + channel] * editWeight);
    }
    return { data, width: source.width, height: source.height };
}

export function scaleLayerBox(box: CanvasImageLayerBox, sourceWidth: number, sourceHeight: number, targetWidth: number, targetHeight: number): CanvasImageLayerBox {
    const left = Math.max(0, Math.floor((box.x / sourceWidth) * targetWidth));
    const top = Math.max(0, Math.floor((box.y / sourceHeight) * targetHeight));
    const right = Math.min(targetWidth, Math.ceil(((box.x + box.width) / sourceWidth) * targetWidth));
    const bottom = Math.min(targetHeight, Math.ceil(((box.y + box.height) / sourceHeight) * targetHeight));
    return { x: left, y: top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) };
}

export async function upscaleDataUrl(dataUrl: string, params: ImageUpscaleParams) {
    const image = await loadImage(dataUrl);
    const { width, height } = resolveUpscaleSize(image.width, image.height, params.targetLongEdge);
    return params.algorithm === "high" ? drawStepUpscale(image, width, height) : drawResize(image, image.width, image.height, width, height, params.algorithm);
}

export function resolveUpscaleSize(width: number, height: number, targetLongEdge: number) {
    const longEdge = Math.max(1, width, height);
    const target = Math.min(MAX_UPSCALE_LONG_EDGE, Math.max(1, Math.round(targetLongEdge)));
    const scale = target / longEdge;
    return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

function drawCrop(image: HTMLImageElement, sx: number, sy: number, sw: number, sh: number) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, sw);
    canvas.height = Math.max(1, sh);
    const context = canvas.getContext("2d");
    if (!context) return image.src;
    context.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
}

function drawCropCanvas(image: HTMLImageElement, box: CanvasImageLayerBox) {
    const canvas = document.createElement("canvas");
    canvas.width = box.width;
    canvas.height = box.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("浏览器不支持图片处理");
    context.drawImage(image, box.x, box.y, box.width, box.height, 0, 0, canvas.width, canvas.height);
    return canvas;
}

export async function validateAndTrimCanvasTransparentLayer(source: string, layerName: string) {
    const canvas = await loadValidatedTransparentCanvas(source, layerName);
    return trimTransparentCanvas(canvas, layerName);
}

export async function validateCanvasTransparentLayer(source: string, layerName: string) {
    await loadValidatedTransparentCanvas(source, layerName);
}

async function loadValidatedTransparentCanvas(source: string, layerName: string) {
    const image = await loadImage(source);
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error(`浏览器不支持处理${layerName}`);
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const hasTransparency = pixels.data.some((value, index) => index % 4 === 3 && value < 255);
    if (!hasTransparency) throw new Error(`${layerName}没有生成透明背景`);
    if (!findCanvasAlphaBounds(pixels)) throw new Error(`没有识别到${layerName}的透明轮廓`);
    return canvas;
}

async function trimTransparentCanvas(canvas: HTMLCanvasElement, layerName: string) {
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error(`浏览器不支持裁切${layerName}`);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const bounds = findCanvasAlphaBounds(pixels);
    if (!bounds) throw new Error(`没有识别到${layerName}的透明轮廓`);
    const trimmed = document.createElement("canvas");
    trimmed.width = bounds.width;
    trimmed.height = bounds.height;
    const trimmedContext = trimmed.getContext("2d");
    if (!trimmedContext) throw new Error(`浏览器不支持生成${layerName}`);
    trimmedContext.putImageData(context.getImageData(bounds.x, bounds.y, trimmed.width, trimmed.height), 0, 0);
    return { blob: await canvasBlob(trimmed), width: trimmed.width, height: trimmed.height };
}

export function findCanvasAlphaBounds(input: Pick<ImageData, "data" | "width" | "height">, threshold = 8): CanvasImageLayerBox | null {
    if (input.width < 1 || input.height < 1 || input.data.length !== input.width * input.height * 4) throw new Error("透明图层像素数据无效");
    let left = input.width;
    let top = input.height;
    let right = -1;
    let bottom = -1;
    for (let y = 0; y < input.height; y += 1) {
        for (let x = 0; x < input.width; x += 1) {
            if (input.data[(y * input.width + x) * 4 + 3] < threshold) continue;
            left = Math.min(left, x);
            top = Math.min(top, y);
            right = Math.max(right, x);
            bottom = Math.max(bottom, y);
        }
    }
    return right < left || bottom < top ? null : { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}

export function expandLayerBox(box: CanvasImageLayerBox, sourceWidth: number, sourceHeight: number): CanvasImageLayerBox {
    const margin = Math.max(4, Math.round(Math.min(box.width, box.height) / 5));
    const left = Math.max(0, box.x - margin);
    const top = Math.max(0, box.y - margin);
    const right = Math.min(sourceWidth, box.x + box.width + margin);
    const bottom = Math.min(sourceHeight, box.y + box.height + margin);
    return { x: left, y: top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) };
}

export function expandLayerRemovalBox(box: CanvasImageLayerBox, sourceWidth: number, sourceHeight: number): CanvasImageLayerBox {
    const margin = Math.max(3, Math.round(Math.min(box.width, box.height) / 20));
    const left = Math.max(0, box.x - margin);
    const top = Math.max(0, box.y - margin);
    const right = Math.min(sourceWidth, box.x + box.width + margin);
    const bottom = Math.min(sourceHeight, box.y + box.height + margin);
    return { x: left, y: top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) };
}

function drawImageData(image: CanvasImageSource, width: number, height: number) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("浏览器不支持图片处理");
    context.drawImage(image, 0, 0, width, height);
    return context.getImageData(0, 0, width, height);
}

async function yieldToBrowser() {
    const scheduler = (globalThis as typeof globalThis & { scheduler?: { yield?: () => Promise<void> } }).scheduler;
    if (scheduler?.yield) return scheduler.yield();
    if (typeof requestAnimationFrame === "function") await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function drawStepUpscale(image: HTMLImageElement, width: number, height: number) {
    let source: CanvasImageSource = image;
    let sourceWidth = image.width;
    let sourceHeight = image.height;

    while (sourceWidth * 2 < width && sourceHeight * 2 < height) {
        const nextWidth = sourceWidth * 2;
        const nextHeight = sourceHeight * 2;
        const next = drawResizeCanvas(source, sourceWidth, sourceHeight, nextWidth, nextHeight, "high");
        source = next;
        sourceWidth = nextWidth;
        sourceHeight = nextHeight;
    }

    return drawResize(source, sourceWidth, sourceHeight, width, height, "high");
}

function drawResize(source: CanvasImageSource, sourceWidth: number, sourceHeight: number, width: number, height: number, algorithm: ImageUpscaleAlgorithm) {
    return drawResizeCanvas(source, sourceWidth, sourceHeight, width, height, algorithm).toDataURL("image/png");
}

function drawResizeCanvas(source: CanvasImageSource, sourceWidth: number, sourceHeight: number, width: number, height: number, algorithm: ImageUpscaleAlgorithm) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return canvas;
    context.imageSmoothingEnabled = algorithm !== "nearest";
    context.imageSmoothingQuality = algorithm === "bilinear" ? "medium" : "high";
    context.drawImage(source, 0, 0, sourceWidth, sourceHeight, 0, 0, width, height);
    return canvas;
}

function loadImage(dataUrl: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("图片读取失败，无法处理图像"));
        image.src = dataUrl;
    });
}

function imageDataBlob(data: Uint8ClampedArray, width: number, height: number) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("浏览器不支持图片处理");
    const pixels = new Uint8ClampedArray(data.length);
    pixels.set(data);
    context.putImageData(new ImageData(pixels, width, height), 0, 0);
    return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("图片编码失败，无法生成图层"))), "image/png"));
}

function canvasBlob(canvas: HTMLCanvasElement) {
    return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("图片编码失败，无法生成图层"))), "image/png"));
}
