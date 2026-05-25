export const shaderCode = `
  struct Uniforms {
    canvas_width: f32,
    canvas_height: f32,
    time: f32,
    _pad0: f32,
  }

  struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
  }

  @group(0) @binding(0) var<uniform> uniforms: Uniforms;

  @vertex
  fn vs_main(@builtin(vertex_index) vertex_index: u32) -> VertexOutput {
    let pos = array(
      vec2f(-1.0,  1.0),
      vec2f(-1.0, -1.0),
      vec2f( 1.0,  1.0),
      vec2f( 1.0, -1.0),
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

  @fragment
  fn fs_main(input: VertexOutput) -> @location(0) vec4f {
    let uv = input.uv;

    // Gradient colors (teal to pink)
    let color_tl = vec3f(0.31, 0.74, 0.73);  // #4FBDBB teal
    let color_mid = vec3f(0.69, 0.74, 0.73); // #AFBDBB gray-teal
    let color_br = vec3f(0.87, 0.74, 0.73);  // #DFBDBB pink

    // Diagonal gradient based on uv.x + uv.y
    let t = (uv.x + uv.y) * 0.5;
    var bg_color: vec3f;
    if (t < 0.5) {
      bg_color = mix(color_tl, color_mid, t * 2.0);
    } else {
      bg_color = mix(color_mid, color_br, (t - 0.5) * 2.0);
    }

    // Grid parameters
    let grid_size = 50.0;  // Size of each grid cell in pixels
    let line_width = 3.0;  // Width of grid lines

    // Animate grid movement (diagonal)
    let anim_offset = uniforms.time * 15.0;  // Speed of animation
    let pixel = input.position.xy + vec2f(anim_offset, anim_offset);

    // Calculate grid lines
    let grid_x = abs(fract(pixel.x / grid_size) - 0.5) * 2.0;
    let grid_y = abs(fract(pixel.y / grid_size) - 0.5) * 2.0;

    // Anti-aliased grid lines
    let line_threshold = 1.0 - (line_width / grid_size);
    let grid_line_x = smoothstep(line_threshold, line_threshold + 0.02, grid_x);
    let grid_line_y = smoothstep(line_threshold, line_threshold + 0.02, grid_y);
    let grid_line = max(grid_line_x, grid_line_y);

    // Grid line color (light, semi-transparent white)
    let grid_color = vec3f(0.84, 0.91, 0.90);  // #D7E8E6
    let grid_opacity = 0.8;

    // Blend grid over background
    let final_color = mix(bg_color, grid_color, grid_line * grid_opacity);

    return vec4f(final_color, 1.0);
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
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: { type: 'uniform' },
      },
    ],
  })
}

export function createBindGroup(
  device: GPUDevice,
  layout: GPUBindGroupLayout,
  uniformBuffer: GPUBuffer
): GPUBindGroup {
  return device.createBindGroup({
    layout,
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer } },
    ],
  })
}
