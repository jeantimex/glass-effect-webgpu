import { loadImage, createTextureFromImage } from './texture'
import {
  createBindGroupLayout,
  createBindGroup,
  createPipeline,
} from './shader'

export class WebGPURenderer {
  private canvas: HTMLCanvasElement
  private device!: GPUDevice
  private context!: GPUCanvasContext
  private format!: GPUTextureFormat
  private pipeline!: GPURenderPipeline
  private bindGroup!: GPUBindGroup
  private uniformBuffer!: GPUBuffer
  private imageBitmap!: ImageBitmap
  private startTime = performance.now()

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
  }

  async init(imageUrl: string): Promise<void> {
    // Initialize WebGPU
    const adapter = await navigator.gpu?.requestAdapter()
    if (!adapter) {
      throw new Error('WebGPU not supported')
    }

    this.device = await adapter.requestDevice()
    this.context = this.canvas.getContext('webgpu') as GPUCanvasContext
    this.format = navigator.gpu.getPreferredCanvasFormat()
    this.context.configure({ device: this.device, format: this.format })

    // Load image
    this.imageBitmap = await loadImage(imageUrl)

    // Create texture
    const texture = createTextureFromImage(this.device, this.imageBitmap)

    // Create sampler
    const sampler = this.device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    })

    // Create uniform buffer
    this.uniformBuffer = this.device.createBuffer({
      size: 48,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })

    // Create bind group layout and group
    const bindGroupLayout = createBindGroupLayout(this.device)
    this.bindGroup = createBindGroup(
      this.device,
      bindGroupLayout,
      texture,
      sampler,
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

    // Update uniforms with current canvas dimensions
    const circleRadius = Math.min(this.canvas.width, this.canvas.height) * 0.22
    const uniformTime = (performance.now() - this.startTime) / 1000
    const uniformData = new Float32Array([
      this.imageBitmap.width,
      this.imageBitmap.height,
      this.canvas.width,
      this.canvas.height,
      this.canvas.width * 0.5,
      this.canvas.height * 0.5,
      circleRadius,
      circleRadius * 0.24,
      uniformTime,
      0,
      0,
      0,
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
