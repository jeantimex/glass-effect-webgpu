export const shaderCode = `
  struct Uniforms {
    image_width: f32,
    image_height: f32,
    canvas_width: f32,
    canvas_height: f32,
  }

  struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
  }

  @group(0) @binding(2) var<uniform> uniforms: Uniforms;

  @vertex
  fn vs_main(@builtin(vertex_index) vertex_index: u32) -> VertexOutput {
    let canvas_aspect = uniforms.canvas_width / uniforms.canvas_height;
    let image_aspect = uniforms.image_width / uniforms.image_height;

    var scale_x = 1.0;
    var scale_y = 1.0;

    if (canvas_aspect > image_aspect) {
      scale_y = canvas_aspect / image_aspect;
    } else {
      scale_x = image_aspect / canvas_aspect;
    }

    let pos = array(
      vec2f(-scale_x,  scale_y),
      vec2f(-scale_x, -scale_y),
      vec2f( scale_x,  scale_y),
      vec2f( scale_x, -scale_y),
    );
    let uv = array(
      vec2f(0.0, 0.0),
      vec2f(0.0, 1.0),
      vec2f(1.0, 0.0),
      vec2f(1.0, 1.0),
    );

    var output: VertexOutput;
    output.position = vec4f(pos[vertex_index], 0.0, 1.0);
    output.uv = uv[vertex_index];
    return output;
  }

  @group(0) @binding(0) var image_texture: texture_2d<f32>;
  @group(0) @binding(1) var image_sampler: sampler;

  @fragment
  fn fs_main(input: VertexOutput) -> @location(0) vec4f {
    return textureSample(image_texture, image_sampler, input.uv);
  }
`

export function createPipeline(
  device: GPUDevice,
  format: GPUTextureFormat,
  bindGroupLayout: GPUBindGroupLayout
): GPURenderPipeline {
  const shaderModule = device.createShaderModule({ code: shaderCode })

  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout],
  })

  return device.createRenderPipeline({
    layout: pipelineLayout,
    vertex: {
      module: shaderModule,
      entryPoint: 'vs_main',
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fs_main',
      targets: [{ format }],
    },
    primitive: {
      topology: 'triangle-strip',
    },
  })
}

export function createBindGroupLayout(device: GPUDevice): GPUBindGroupLayout {
  return device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {
          sampleType: 'float',
          viewDimension: '2d',
        },
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: { type: 'filtering' },
      },
      {
        binding: 2,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: 'uniform' },
      },
    ],
  })
}

export function createBindGroup(
  device: GPUDevice,
  layout: GPUBindGroupLayout,
  texture: GPUTexture,
  sampler: GPUSampler,
  uniformBuffer: GPUBuffer
): GPUBindGroup {
  return device.createBindGroup({
    layout,
    entries: [
      { binding: 0, resource: texture.createView() },
      { binding: 1, resource: sampler },
      { binding: 2, resource: { buffer: uniformBuffer } },
    ],
  })
}
