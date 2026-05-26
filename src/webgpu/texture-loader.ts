export class BackgroundTextureLoader {
  private textureCache = new Map<string, GPUTexture>()

  constructor(private device: GPUDevice) {}

  async load(url: string): Promise<GPUTexture> {
    const cachedTexture = this.textureCache.get(url)
    if (cachedTexture) return cachedTexture

    const img = new Image()
    img.src = url
    await img.decode()

    let source: TexImageSource = img
    let width = img.width
    let height = img.height

    // If it's an SVG (ends with .svg), render to canvas to ensure transparency and size
    if (url.toLowerCase().endsWith('.svg')) {
      const canvas = document.createElement('canvas')
      const size = 512 // Fixed high resolution for icons
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, size, size)
        
        // Use a composite operation to force the icon to be white/visible
        // This is a backup if the SVG itself has hardcoded colors
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, size, size)
        ctx.globalCompositeOperation = 'destination-in'
        ctx.drawImage(img, 0, 0, size, size)
        
        // Reset composite for next draw if needed
        ctx.globalCompositeOperation = 'source-over'
        
        source = canvas
        width = size
        height = size
      }
    }

    const mipLevelCount = Math.floor(Math.log2(Math.max(width, height))) + 1
    const texture = this.device.createTexture({
      size: [width, height],
      format: 'rgba8unorm',
      mipLevelCount,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    })

    this.device.queue.copyExternalImageToTexture(
      { source },
      { texture },
      [width, height]
    )

    await this.generateMipmaps(texture, mipLevelCount)
    this.textureCache.set(url, texture)
    return texture
  }

  private async generateMipmaps(texture: GPUTexture, mipLevelCount: number): Promise<void> {
    const mipmapShaderModule = this.device.createShaderModule({
      code: `
        var<private> pos: array<vec2f, 4> = array(
          vec2f(-1.0, 1.0), vec2f(1.0, 1.0), vec2f(-1.0, -1.0), vec2f(1.0, -1.0)
        );
        var<private> uv: array<vec2f, 4> = array(
          vec2f(0.0, 0.0), vec2f(1.0, 0.0), vec2f(0.0, 1.0), vec2f(1.0, 1.0)
        );

        struct VertexOutput {
          @builtin(position) position: vec4f,
          @location(0) texCoord: vec2f,
        }

        @vertex
        fn vs(@builtin(vertex_index) i: u32) -> VertexOutput {
          var o: VertexOutput;
          o.position = vec4f(pos[i], 0.0, 1.0);
          o.texCoord = uv[i];
          return o;
        }

        @group(0) @binding(0) var inTexture: texture_2d<f32>;
        @group(0) @binding(1) var inSampler: sampler;

        @fragment
        fn fs(@location(0) texCoord: vec2f) -> @location(0) vec4f {
          return textureSample(inTexture, inSampler, texCoord);
        }
      `
    })

    const pipeline = this.device.createRenderPipeline({
      layout: 'auto',
      vertex: { module: mipmapShaderModule, entryPoint: 'vs' },
      fragment: {
        module: mipmapShaderModule,
        entryPoint: 'fs',
        targets: [{ format: 'rgba8unorm' }]
      },
      primitive: { topology: 'triangle-strip' }
    })
    const sampler = this.device.createSampler({ minFilter: 'linear', magFilter: 'linear' })

    for (let i = 1; i < mipLevelCount; i++) {
      const srcView = texture.createView({ baseMipLevel: i - 1, mipLevelCount: 1 })
      const dstView = texture.createView({ baseMipLevel: i, mipLevelCount: 1 })
      const bindGroup = this.device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: srcView },
          { binding: 1, resource: sampler }
        ]
      })

      const commandEncoder = this.device.createCommandEncoder()
      const passEncoder = commandEncoder.beginRenderPass({
        colorAttachments: [{
          view: dstView,
          loadOp: 'clear',
          storeOp: 'store'
        }]
      })

      passEncoder.setPipeline(pipeline)
      passEncoder.setBindGroup(0, bindGroup)
      passEncoder.draw(4)
      passEncoder.end()
      this.device.queue.submit([commandEncoder.finish()])
    }
  }
}
