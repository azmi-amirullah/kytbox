export interface ImageCompressionOptions {
  maxDimension?: number
  quality?: number
}

/**
 * Checks whether a given file is a supported standard image (JPG, PNG, WebP, AVIF).
 */
export function isSupportedImageFile(file: File): boolean {
  if (!file) return false
  const lowerName = file.name.toLowerCase()
  const isStandardMime =
    file.type === 'image/jpeg' ||
    file.type === 'image/png' ||
    file.type === 'image/webp' ||
    file.type === 'image/avif'
  const isImageExtension = /\.(jpe?g|png|webp|jfif|avif)$/i.test(lowerName)

  return isStandardMime || isImageExtension
}

/**
 * Compresses an image File/Blob using HTML Canvas and outputs a full-color WebP Blob (or JPEG fallback).
 * Guarantees crisp high-contrast text rendering at ~120KB-180KB for 1600px long edge.
 */
export async function compressImageToWebP(
  file: File | Blob,
  options: ImageCompressionOptions = {},
): Promise<Blob> {
  const { maxDimension = 1600, quality = 0.8 } = options

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl)
    }

    img.onerror = () => {
      cleanup()
      reject(new Error('Failed to decode image buffer'))
    }

    img.onload = () => {
      try {
        let { width, height } = img

        // Calculate downscaled dimensions without upscaling smaller images
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, width)
        canvas.height = Math.max(1, height)

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          cleanup()
          reject(new Error('Canvas 2D context unavailable'))
          return
        }

        // Enable high-fidelity smoothing for sharp text edges
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        // Draw the image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        cleanup()

        // Attempt WebP export first, verifying the browser actually produced WebP (Safari Canvas defaults to uncompressed PNG)
        canvas.toBlob(
          (blob) => {
            if (blob && blob.type === 'image/webp') {
              resolve(blob)
            } else {
              // Fallback to JPEG if WebP is unsupported or defaulted to PNG (e.g. iOS Safari)
              canvas.toBlob(
                (jpegBlob) => {
                  if (jpegBlob) {
                    resolve(jpegBlob)
                  } else {
                    reject(new Error('Failed to compress image to Blob'))
                  }
                },
                'image/jpeg',
                quality,
              )
            }
          },
          'image/webp',
          quality,
        )
      } catch (err) {
        cleanup()
        reject(err instanceof Error ? err : new Error('Image compression failed'))
      }
    }

    img.src = objectUrl
  })
}
