export const shaderCode = `
  struct Uniforms {
    image_width: f32,
    image_height: f32,
    canvas_width: f32,
    canvas_height: f32,
    circle_x: f32,
    circle_y: f32,
    circle_radius: f32,
    circle_bezel_width: f32,
    time: f32,
    _pad0: f32,
    _pad1: f32,
    _pad2: f32,
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
    let source = textureSample(image_texture, image_sampler, input.uv);
    let circle_center = vec2f(uniforms.circle_x, uniforms.circle_y);
    let pixel = input.position.xy;
    let to_pixel = pixel - circle_center;
    let distance_from_center = length(to_pixel);
    let signed_distance_from_edge = uniforms.circle_radius - distance_from_center;

    if (signed_distance_from_edge < 0.0) {
      return source;
    }

    let bezel = max(uniforms.circle_bezel_width, 1.0);
    let bezel_t = clamp(signed_distance_from_edge / bezel, 0.0, 1.0);
    let outer_alpha = smoothstep(-1.0, 1.0, signed_distance_from_edge);
    let rim_alpha = smoothstep(0.0, 1.0, bezel_t) * (1.0 - smoothstep(0.58, 1.0, bezel_t));

    let radial = select(vec2f(0.0, -1.0), to_pixel / max(distance_from_center, 0.0001), distance_from_center > 0.0001);
    let light_dir = normalize(vec2f(0.72, -0.42));
    let specular = pow(max(dot(-radial, light_dir), 0.0), 9.0) * rim_alpha;
    let edge = 1.0 - smoothstep(0.0, 2.2, abs(signed_distance_from_edge));

    let glass_tint = vec3f(0.04, 0.08, 0.19);
    let rim_color = vec3f(0.06, 0.19, 0.95);
    let highlight_color = vec3f(1.0, 0.24, 0.62);

    var color = mix(source.rgb, source.rgb * 0.48 + glass_tint, 0.34 * outer_alpha);
    color = mix(color, rim_color, edge * 0.78);
    color += highlight_color * specular * 0.9;

    return vec4f(color, source.a);
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
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
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
