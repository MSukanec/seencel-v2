/**
 * Color Extraction Utilities
 * 
 * Funciones para extraer y procesar colores de imágenes
 * usando Canvas API y algoritmos de clustering.
 */

import type { ExtractedColor, OklchColor } from '../types/palette';

/**
 * Convert RGB to oklch color space
 * More perceptually uniform than HSL
 */
export function rgbToOklch(r: number, g: number, b: number): OklchColor {
    // Normalize RGB to 0-1
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    // Convert to linear RGB
    const rLin = rNorm <= 0.04045 ? rNorm / 12.92 : Math.pow((rNorm + 0.055) / 1.055, 2.4);
    const gLin = gNorm <= 0.04045 ? gNorm / 12.92 : Math.pow((gNorm + 0.055) / 1.055, 2.4);
    const bLin = bNorm <= 0.04045 ? bNorm / 12.92 : Math.pow((bNorm + 0.055) / 1.055, 2.4);

    // Convert to XYZ (D65)
    const x = 0.4124564 * rLin + 0.3575761 * gLin + 0.1804375 * bLin;
    const y = 0.2126729 * rLin + 0.7151522 * gLin + 0.0721750 * bLin;
    const z = 0.0193339 * rLin + 0.1191920 * gLin + 0.9503041 * bLin;

    // Convert to Lab (intermediate step)
    const l_ = 0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z;
    const m_ = 0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z;
    const s_ = 0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z;

    const l__ = Math.cbrt(l_);
    const m__ = Math.cbrt(m_);
    const s__ = Math.cbrt(s_);

    const L = 0.2104542553 * l__ + 0.7936177850 * m__ - 0.0040720468 * s__;
    const a = 1.9779984951 * l__ - 2.4285922050 * m__ + 0.4505937099 * s__;
    const bVal = 0.0259040371 * l__ + 0.7827717662 * m__ - 0.8086757660 * s__;

    // Convert to oklch
    const c = Math.sqrt(a * a + bVal * bVal);
    let h = Math.atan2(bVal, a) * (180 / Math.PI);
    if (h < 0) h += 360;

    return {
        l: Math.max(0, Math.min(1, L)),
        c: Math.max(0, Math.min(0.4, c)),
        h: h
    };
}

/**
 * Format oklch color as CSS string
 */
export function oklchToCss(color: OklchColor): string {
    return `oklch(${(color.l * 100).toFixed(1)}% ${color.c.toFixed(3)} ${color.h.toFixed(1)})`;
}

/**
 * Adjust luminance of oklch color
 */
export function adjustLuminance(color: OklchColor, amount: number): OklchColor {
    return {
        ...color,
        l: Math.max(0, Math.min(1, color.l + amount))
    };
}

/**
 * Adjust chroma (saturation) of oklch color
 */
export function adjustChroma(color: OklchColor, multiplier: number): OklchColor {
    return {
        ...color,
        c: Math.max(0, Math.min(0.4, color.c * multiplier))
    };
}

/**
 * RGB to hex string
 */
export function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Simple k-means clustering for color quantization
 */
function kMeans(pixels: number[][], k: number, maxIterations = 10): number[][] {
    // Initialize centroids randomly from pixels
    const centroids: number[][] = [];
    const usedIndices = new Set<number>();

    while (centroids.length < k && usedIndices.size < pixels.length) {
        const idx = Math.floor(Math.random() * pixels.length);
        if (!usedIndices.has(idx)) {
            usedIndices.add(idx);
            centroids.push([...pixels[idx]]);
        }
    }

    for (let iter = 0; iter < maxIterations; iter++) {
        // Assign pixels to nearest centroid
        const clusters: number[][][] = centroids.map(() => []);

        for (const pixel of pixels) {
            let minDist = Infinity;
            let minIdx = 0;

            for (let i = 0; i < centroids.length; i++) {
                const dist = Math.sqrt(
                    Math.pow(pixel[0] - centroids[i][0], 2) +
                    Math.pow(pixel[1] - centroids[i][1], 2) +
                    Math.pow(pixel[2] - centroids[i][2], 2)
                );
                if (dist < minDist) {
                    minDist = dist;
                    minIdx = i;
                }
            }

            clusters[minIdx].push(pixel);
        }

        // Update centroids
        for (let i = 0; i < centroids.length; i++) {
            if (clusters[i].length > 0) {
                centroids[i] = [
                    clusters[i].reduce((sum, p) => sum + p[0], 0) / clusters[i].length,
                    clusters[i].reduce((sum, p) => sum + p[1], 0) / clusters[i].length,
                    clusters[i].reduce((sum, p) => sum + p[2], 0) / clusters[i].length
                ];
            }
        }
    }

    return centroids;
}

/**
 * Extract dominant colors from an image
 */
export async function extractColorsFromImage(
    imageSource: string | File,
    numColors: number = 6
): Promise<ExtractedColor[]> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            // Create canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas not supported'));
                return;
            }

            // Scale down for performance (max 100x100)
            const scale = Math.min(100 / img.width, 100 / img.height, 1);
            canvas.width = Math.floor(img.width * scale);
            canvas.height = Math.floor(img.height * scale);

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels: number[][] = [];

            // Sample pixels (skip very dark/light)
            for (let i = 0; i < imageData.data.length; i += 4) {
                const r = imageData.data[i];
                const g = imageData.data[i + 1];
                const b = imageData.data[i + 2];
                const a = imageData.data[i + 3];

                // Skip transparent pixels
                if (a < 128) continue;

                // Skip very dark or very light pixels
                const brightness = (r + g + b) / 3;
                if (brightness < 20 || brightness > 235) continue;

                pixels.push([r, g, b]);
            }

            if (pixels.length < numColors) {
                reject(new Error('Not enough color data in image'));
                return;
            }

            // Run k-means clustering
            const centroids = kMeans(pixels, numColors);

            // Count pixels in each cluster for population
            const populations = new Array(centroids.length).fill(0);
            for (const pixel of pixels) {
                let minDist = Infinity;
                let minIdx = 0;
                for (let i = 0; i < centroids.length; i++) {
                    const dist = Math.sqrt(
                        Math.pow(pixel[0] - centroids[i][0], 2) +
                        Math.pow(pixel[1] - centroids[i][1], 2) +
                        Math.pow(pixel[2] - centroids[i][2], 2)
                    );
                    if (dist < minDist) {
                        minDist = dist;
                        minIdx = i;
                    }
                }
                populations[minIdx]++;
            }

            // Convert to ExtractedColor format
            const colors: ExtractedColor[] = centroids.map((centroid, i) => {
                const r = Math.round(centroid[0]);
                const g = Math.round(centroid[1]);
                const b = Math.round(centroid[2]);
                return {
                    rgb: { r, g, b },
                    hex: rgbToHex(r, g, b),
                    oklch: rgbToOklch(r, g, b),
                    population: populations[i]
                };
            });

            // Sort by "vibrancy score" - combination of population and chroma (saturation)
            // This prioritizes saturated/vibrant colors over dull ones even if less common
            const totalPopulation = populations.reduce((a, b) => a + b, 0);
            colors.sort((a, b) => {
                // Normalize population to 0-1
                const popA = a.population / totalPopulation;
                const popB = b.population / totalPopulation;

                // Get chroma (saturation) from oklch - normalize to 0-1 (max chroma ~0.4)
                const chromaA = Math.min(a.oklch.c / 0.3, 1);
                const chromaB = Math.min(b.oklch.c / 0.3, 1);

                // Combined score: vibrant colors get boosted
                // Formula: population * (1 + chroma * boost_factor)
                // High chroma (saturated) colors get up to 3x boost
                const scoreA = popA * (1 + chromaA * 2);
                const scoreB = popB * (1 + chromaB * 2);

                return scoreB - scoreA;
            });

            resolve(colors);
        };

        img.onerror = () => reject(new Error('Failed to load image'));

        if (typeof imageSource === 'string') {
            img.src = imageSource;
        } else {
            img.src = URL.createObjectURL(imageSource);
        }
    });
}
