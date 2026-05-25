import {
  createBindGroupLayout,
  createBindGroup,
  createPipeline,
} from './shader'

export interface GlassParams {
  bezelWidth: number
  glassThickness: number
  scaleRatio: number
  surfaceType: number  // 0=convex-circle, 1=convex-squircle, 2=concave, 3=lip
  gridCellSize: number // grid cell size in pixels
  gridSpeed: number    // grid animation speed multiplier
}

export class WebGPURenderer {
  private canvas: HTMLCanvasElement
  private device!: GPUDevice
  private context!: GPUCanvasContext
  private format!: GPUTextureFormat
  private pipeline!: GPURenderPipeline
  private bindGroup!: GPUBindGroup
  private uniformBuffer!: GPUBuffer
  private startTime = performance.now()

  public glassParams: GlassParams = {
    bezelWidth: 60,
    glassThickness: 50,
    scaleRatio: 1.0,
    surfaceType: 0,
    gridCellSize: 105,
    gridSpeed: 40,
  }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  async init(): Promise<void> {
    // Initialize WebGPU
    const adapter = await navigator.gpu?.requestAdapter()
    if (!adapter) {
      throw new Error('WebGPU not supported')
    }

    this.device = await adapter.requestDevice()
    this.context = this.canvas.getContext('webgpu') as GPUCanvasContext
    this.format = navigator.gpu.getPreferredCanvasFormat()
    this.context.configure({ device: this.device, format: this.format })

    // Create uniform buffer (12 floats = 48 bytes, padded to 16-byte alignment)
    this.uniformBuffer = this.device.createBuffer({
      size: 48,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })

    // Create bind group layout and group
    const bindGroupLayout = createBindGroupLayout(this.device)
    this.bindGroup = createBindGroup(
      this.device,
      bindGroupLayout,
      this.uniformBuffer
    )

    // Create pipeline
    this.pipeline = createPipeline(this.device, this.format, bindGroupLayout)

    // Setup resize listener
    window.addEventListener('resize', () => this.resizeCanvas())
    this.resizeCanvas()
  }

  private resizeCanvas(): void {
    const dpr = window.devicePixelRatio || 1
    const displayWidth = this.canvas.clientWidth * dpr
    const displayHeight = this.canvas.clientHeight * dpr

    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
      this.canvas.width = displayWidth
      this.canvas.height = displayHeight
    }
  }

  render(): void {
    this.resizeCanvas()

    // Calculate glass radius based on canvas size
    const glassRadius = Math.min(this.canvas.width, this.canvas.height) * 0.35

    // Update uniforms
    const uniformTime = (performance.now() - this.startTime) / 1000
    const uniformData = new Float32Array([
      this.canvas.width,
      this.canvas.height,
      uniformTime,
      this.canvas.width / 2,   // glass_center_x
      this.canvas.height / 2,  // glass_center_y
      glassRadius,             // glass_radius
      this.glassParams.bezelWidth,
      this.glassParams.glassThickness,
      this.glassParams.scaleRatio,
      this.glassParams.surfaceType,
      this.glassParams.gridCellSize,
      this.glassParams.gridSpeed,
    ])
    this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData)

    const commandEncoder = this.device.createCommandEncoder()
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          clearValue: { r: 0.1, g: 0.1, b: 0.12, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    })

    renderPass.setPipeline(this.pipeline)
    renderPass.setBindGroup(0, this.bindGroup)
    renderPass.draw(4)
    renderPass.end()

    this.device.queue.submit([commandEncoder.finish()])
  }
}
