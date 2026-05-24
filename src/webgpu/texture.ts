export async function loadImage(url: string): Promise<ImageBitmap> {
  const response = await fetch(url)
  const blob = await response.blob()
  return createImageBitmap(blob)
}

export function createTextureFromImage(
  device: GPUDevice,
  imageBitmap: ImageBitmap
): GPUTexture {
  const texture = device.createTexture({
    size: [imageBitmap.width, imageBitmap.height, 1],
    format: 'rgba8unorm',
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
    mipLevelCount: 1,
  })

  device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture },
    [imageBitmap.width, imageBitmap.height]
  )

  return texture
}
