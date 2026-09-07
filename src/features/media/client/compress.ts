import imageCompression from 'browser-image-compression'

/**
 * Telefon fotoğrafını (5-10 MB) yüklemeden önce küçültür: en fazla 1920px, WebP, ~0.8 kalite.
 * Çalışanın kotasını ve sitenin hızını korur.
 */
export async function compressImage(file: File): Promise<File> {
  return imageCompression(file, {
    maxWidthOrHeight: 1920,
    maxSizeMB: 0.8,
    initialQuality: 0.82,
    useWebWorker: true,
    fileType: 'image/webp',
    preserveExif: false,
  })
}

export async function readImageSize(file: Blob): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file)
    const size = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return size
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Görsel okunamadı'))
    }
    img.src = url
  })
}
