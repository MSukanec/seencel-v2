const sharp = require('sharp');
console.log("Sharp loaded successfully");

async function test() {
    try {
        const image = await sharp({
            create: {
                width: 100,
                height: 100,
                channels: 4,
                background: { r: 255, g: 0, b: 0, alpha: 0.5 }
            }
        })
            .png()
            .toBuffer();
        console.log("Sharp processing worked, buffer length:", image.length);
    } catch (e) {
        console.error("Sharp failed:", e);
    }
}

test();
