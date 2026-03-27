/**
 * Compresses an image file using Canvas API with WebP format.
 * Falls back to JPEG if WebP is not supported by the browser.
 * GIF files are skipped (returned as-is).
 *
 * @param file - The original image File object
 * @param quality - Compression quality 0.0 to 1.0 (default: 0.85)
 * @param maxWidth - Max width to resize to (default: 1920)
 * @param maxHeight - Max height to resize to (default: 1080)
 */
export const compressImage = async (
    file: File,
    quality = 0.85,
    maxWidth = 1920,
    maxHeight = 1080
): Promise<File> => {
    return new Promise((resolve) => {
        // Skip non-images and GIFs (GIF animation would be lost)
        if (!file.type.startsWith("image/") || file.type === "image/gif") {
            return resolve(file);
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (!ctx) return resolve(file);

                // Proportional resize
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round(height * (maxWidth / width));
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = Math.round(width * (maxHeight / height));
                    height = maxHeight;
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // Prefer WebP (better compression, same quality)
                const supportsWebP = canvas.toDataURL("image/webp").startsWith("data:image/webp");
                const outputMime = supportsWebP ? "image/webp" : "image/jpeg";
                const outputExt = supportsWebP ? ".webp" : ".jpg";

                // Replace extension in filename
                const baseName = file.name.replace(/\.[^/.]+$/, "");
                const newFileName = `${baseName}${outputExt}`;

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(new File([blob], newFileName, { type: outputMime }));
                        } else {
                            resolve(file); // fallback to original on error
                        }
                    },
                    outputMime,
                    quality
                );
            };

            img.onerror = () => resolve(file);
        };

        reader.onerror = () => resolve(file);
    });
};
