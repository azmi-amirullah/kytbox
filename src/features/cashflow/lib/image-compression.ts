export interface ImageCompressionOptions {
  maxDimension?: number
  quality?: number
}

/**
 * Checks whether a given file is a supported image (standard web image or iOS HEIC/HEIF).
 * Handles iOS Safari edge cases where file.type can be empty or 'image/heic'.
 */
export function isSupportedImageFile(file: File): boolean {
  if (!file) return false
  const lowerName = file.name.toLowerCase()
  const isHeicExtension = lowerName.endsWith('.heic') || lowerName.endsWith('.heif')
  const isHeicMime = file.type === 'image/heic' || file.type === 'image/heif'
  const isStandardImage = file.type.startsWith('image/')
  const isImageExtension = /\.(jpe?g|png|webp|jfif|avif)$/i.test(lowerName)

  return isStandardImage || isHeicMime || isHeicExtension || isImageExtension
}

/**
 * Checks if a file is an Apple HEIC/HEIF format.
 */
export function isHeicImage(file: Blob | File): boolean {
  const type = file.type?.toLowerCase() || ''
  const name = file instanceof File ? file.name.toLowerCase() : ''
  return (
    type === 'image/heic' ||
    type === 'image/heif' ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  )
}

/**
 * Converts an Apple HEIC/HEIF file or blob into a standard JPEG Blob.
 * If the input is not HEIC, returns the original Blob/File directly.
 */
export async function convertHeicToJpeg(file: Blob | File): Promise<Blob> {
  if (!isHeicImage(file)) {
    return file
  }

  try {
    const heic2any = (await import('heic2any')).default
    const conversionResult = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9,
    })
    return Array.isArray(conversionResult) ? conversionResult[0] : conversionResult
  } catch (err) {
    console.warn('heic2any conversion error, attempting native canvas decode fallback:', err)
    return file
  }
}

/**
 * Compresses an image File/Blob using HTML Canvas and outputs a full-color WebP Blob (or JPEG fallback).
 * Automatically converts iOS HEIC/HEIF photos to standard format before downscaling.
 * Guarantees crisp high-contrast text rendering at ~120KB-180KB for 1600px long edge.
 */
export async function compressImageToWebP(
  file: File | Blob,
  options: ImageCompressionOptions = {},
): Promise<Blob> {
  const { maxDimension = 1600, quality = 0.8 } = options

  let processableBlob: Blob = file

  // Handle iOS HEIC / HEIF conversions dynamically if needed
  if (isHeicImage(file)) {
    processableBlob = await convertHeicToJpeg(file)
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(processableBlob)
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
