import sharp from 'sharp';

interface OptimizationOptions {
    maxWidth?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
}

/**
 * Optimizes an image buffer for web use.
 * Defaults: 1024px width (contain), WebP format, 80% quality.
 * @param buffer Raw file buffer
 * @param options Custom optimization options
 * @returns Optimized buffer and metadata
 */
export async function optimizeImage(
    buffer: Buffer,
    options: OptimizationOptions = {}
) {
    const {
        maxWidth = 1024,
        quality = 80,
        format = 'webp'
    } = options;

    const pipeline = sharp(buffer)
        .resize({
            width: maxWidth,
            height: maxWidth,
            fit: 'inside', // Maintains aspect ratio, fits within box
            withoutEnlargement: true // Don't upscale small images
        });

    let optimizedBuffer: Buffer;
    let mimeType: string;

    switch (format) {
        case 'jpeg':
            optimizedBuffer = await pipeline.jpeg({ quality }).toBuffer();
            mimeType = 'image/jpeg';
            break;
        case 'png':
            optimizedBuffer = await pipeline.png({ quality }).toBuffer();
            mimeType = 'image/png';
            break;
        case 'webp':
        default:
            optimizedBuffer = await pipeline.webp({ quality }).toBuffer();
            mimeType = 'image/webp';
            break;
    }

    return {
        buffer: optimizedBuffer,
        extension: format,
        mimeType
    };
}

