export type SurfaceType = 'convex-circle' | 'convex-squircle' | 'concave' | 'lip'

const surfaceFunctions: Record<SurfaceType, (x: number) => number> = {
  'convex-circle': (x) => Math.sqrt(1 - (1 - x) ** 2),
  'convex-squircle': (x) => Math.pow(1 - Math.pow(1 - x, 4), 1 / 4),
  'concave': (x) => 1 - Math.sqrt(1 - (1 - x) ** 2),
  'lip': (x) => {
    const convex = Math.pow(1 - Math.pow(1 - x * 2, 4), 1 / 4)
    const concave = 1 - Math.sqrt(1 - (1 - x) ** 2) + 0.1
    const smootherstep = 6 * x ** 5 - 15 * x ** 4 + 10 * x ** 3
    return convex * (1 - smootherstep) + concave * smootherstep
  },
}

export function calculateDisplacementMap1D(
  glassThickness: number,
  bezelWidth: number,
  surfaceType: SurfaceType,
  refractiveIndex: number,
  samples: number = 128
): number[] {
  const eta = 1 / refractiveIndex
  const heightFn = surfaceFunctions[surfaceType]

  function refract(normalX: number, normalY: number): [number, number] | null {
    const dot = normalY
    const k = 1 - eta * eta * (1 - dot * dot)
    if (k < 0) return null
    const kSqrt = Math.sqrt(k)
    return [
      -(eta * dot + kSqrt) * normalX,
      eta - (eta * dot + kSqrt) * normalY,
    ]
  }

  return Array.from({ length: samples }, (_, i) => {
    const x = i / samples
    const y = heightFn(x)

    const dx = x < 1 ? 0.0001 : -0.0001
    const y2 = heightFn(x + dx)
    const derivative = (y2 - y) / dx
    const magnitude = Math.sqrt(derivative * derivative + 1)
    const normal: [number, number] = [-derivative / magnitude, -1 / magnitude]
    const refracted = refract(normal[0], normal[1])

    if (!refracted) {
      return 0
    } else {
      const remainingHeightOnBezel = y * bezelWidth
      const remainingHeight = remainingHeightOnBezel + glassThickness
      return refracted[0] * (remainingHeight / refracted[1])
    }
  })
}

export function renderDisplacementMap2D(
  canvas: HTMLCanvasElement,
  displacements1D: number[],
  bezelWidth: number
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const size = canvas.clientWidth
  canvas.width = size * dpr
  canvas.height = size * dpr

  const imageData = ctx.createImageData(canvas.width, canvas.height)
  const data = imageData.data

  const maxDisplacement = Math.max(...displacements1D.map(Math.abs), 1)
  const radius = (size * dpr) / 2 - 10 * dpr
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const bezel = bezelWidth * dpr * (radius / 100)

  // Fill with olive/yellow background (neutral displacement color on dark bg)
  const bgR = 90, bgG = 106, bgB = 80
  for (let i = 0; i < data.length; i += 4) {
    data[i] = bgR
    data[i + 1] = bgG
    data[i + 2] = bgB
    data[i + 3] = 255
  }

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const dx = x - centerX
      const dy = y - centerY
      const distanceFromCenter = Math.sqrt(dx * dx + dy * dy)
      const distanceFromEdge = radius - distanceFromCenter

      if (distanceFromEdge < 0 || distanceFromEdge > bezel) continue

      const bezelT = distanceFromEdge / bezel
      const sampleIndex = Math.min(
        displacements1D.length - 1,
        Math.floor(bezelT * displacements1D.length)
      )
      const displacement = displacements1D[sampleIndex] || 0
      const normalizedDisplacement = displacement / maxDisplacement

      // Direction from center
      const cos = distanceFromCenter > 0.001 ? dx / distanceFromCenter : 0
      const sin = distanceFromCenter > 0.001 ? dy / distanceFromCenter : 0

      // Displacement vector components
      const dispX = -cos * normalizedDisplacement
      const dispY = -sin * normalizedDisplacement

      // Encode as color: R = X displacement, G = Y displacement
      // 128 = neutral, 0 = -1, 255 = +1
      const r = Math.round(128 + dispX * 127)
      const g = Math.round(128 + dispY * 127)

      const idx = (y * canvas.width + x) * 4
      data[idx] = r
      data[idx + 1] = g
      data[idx + 2] = 0
      data[idx + 3] = 255
    }
  }

  // Draw center circle (flat region - neutral color)
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const dx = x - centerX
      const dy = y - centerY
      const distanceFromCenter = Math.sqrt(dx * dx + dy * dy)
      const distanceFromEdge = radius - distanceFromCenter

      if (distanceFromEdge > bezel) {
        const idx = (y * canvas.width + x) * 4
        data[idx] = 128
        data[idx + 1] = 128
        data[idx + 2] = 0
        data[idx + 3] = 255
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)
}
