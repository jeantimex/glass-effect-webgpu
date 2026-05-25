export const shaderCode = `
  struct Uniforms {
    canvas_width: f32,
    canvas_height: f32,
    time: f32,
    glass_center_x: f32,
    glass_center_y: f32,
    glass_radius: f32,
    bezel_width: f32,
    glass_thickness: f32,
    scale_ratio: f32,
    surface_type: f32,
    _pad0: f32,
    _pad1: f32,
  }

  struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
  }

  @group(0) @binding(0) var<uniform> uniforms: Uniforms;

  // Surface height functions (x = 0 at edge, x = 1 at end of bezel)
  fn surface_convex_circle(x: f32) -> f32 {
    return sqrt(1.0 - pow(1.0 - x, 2.0));
  }

  fn surface_convex_squircle(x: f32) -> f32 {
    return pow(1.0 - pow(1.0 - x, 4.0), 0.25);
  }

  fn surface_concave(x: f32) -> f32 {
    return 1.0 - sqrt(1.0 - pow(1.0 - x, 2.0));
  }

  fn surface_lip(x: f32) -> f32 {
    let convex = pow(1.0 - pow(1.0 - clamp(x * 2.0, 0.0, 1.0), 4.0), 0.25);
    let concave = 1.0 - sqrt(1.0 - pow(1.0 - x, 2.0)) + 0.1;
    let smootherstep = 6.0 * pow(x, 5.0) - 15.0 * pow(x, 4.0) + 10.0 * pow(x, 3.0);
    return convex * (1.0 - smootherstep) + concave * smootherstep;
  }

  fn get_surface_height(x: f32, surface_type: f32) -> f32 {
    let t = i32(surface_type);
    if (t == 0) { return surface_convex_circle(x); }
    if (t == 1) { return surface_convex_squircle(x); }
    if (t == 2) { return surface_concave(x); }
    return surface_lip(x);
  }

  fn get_surface_derivative(x: f32, surface_type: f32) -> f32 {
    let dx = 0.001;
    let y1 = get_surface_height(x - dx, surface_type);
    let y2 = get_surface_height(x + dx, surface_type);
    return (y2 - y1) / (2.0 * dx);
  }

  // Refraction using Snell's law
  // Returns displacement amount for a ray hitting surface at bezel position x
  fn calculate_displacement(bezel_t: f32, surface_type: f32, bezel_width: f32, glass_thickness: f32) -> f32 {
    let eta = 1.0 / 1.5;  // air to glass (n=1.5)

    let height = get_surface_height(bezel_t, surface_type);
    let derivative = get_surface_derivative(bezel_t, surface_type);

    // Calculate normal from derivative (rotate tangent by 90 degrees)
    let magnitude = sqrt(derivative * derivative + 1.0);
    let normal_x = -derivative / magnitude;
    let normal_y = -1.0 / magnitude;

    // Incident ray is straight down: (0, 1)
    // Simplified refraction for vertical incident ray
    let dot_ni = normal_y;  // dot((0,1), normal)
    let k = 1.0 - eta * eta * (1.0 - dot_ni * dot_ni);

    if (k < 0.0) {
      return 0.0;  // Total internal reflection
    }

    let k_sqrt = sqrt(k);
    let refracted_x = -(eta * dot_ni + k_sqrt) * normal_x;
    let refracted_y = eta - (eta * dot_ni + k_sqrt) * normal_y;

    // Calculate displacement based on remaining glass height
    let remaining_height = height * bezel_width + glass_thickness;

    if (abs(refracted_y) < 0.001) {
      return 0.0;
    }

    return refracted_x * (remaining_height / refracted_y);
  }

  // Sample background at a pixel position
  fn sample_background(pixel: vec2f, time: f32) -> vec3f {
    let uv = pixel / vec2f(uniforms.canvas_width, uniforms.canvas_height);

    // Gradient colors (teal to pink)
    let color_tl = vec3f(0.31, 0.74, 0.73);
    let color_mid = vec3f(0.69, 0.74, 0.73);
    let color_br = vec3f(0.87, 0.74, 0.73);

    let t = (uv.x + uv.y) * 0.5;
    var bg_color: vec3f;
    if (t < 0.5) {
      bg_color = mix(color_tl, color_mid, t * 2.0);
    } else {
      bg_color = mix(color_mid, color_br, (t - 0.5) * 2.0);
    }

    // Grid - size so that circle radius = 3.5 cells
    let grid_size = uniforms.glass_radius / 3.5;
    let line_width = max(2.0, grid_size * 0.05);
    let anim_offset = time * 15.0;
    let grid_pixel = pixel - vec2f(anim_offset, anim_offset);

    let grid_x = abs(fract(grid_pixel.x / grid_size) - 0.5) * 2.0;
    let grid_y = abs(fract(grid_pixel.y / grid_size) - 0.5) * 2.0;

    let line_threshold = 1.0 - (line_width / grid_size);
    let grid_line_x = smoothstep(line_threshold, line_threshold + 0.02, grid_x);
    let grid_line_y = smoothstep(line_threshold, line_threshold + 0.02, grid_y);
    let grid_line = max(grid_line_x, grid_line_y);

    let grid_color = vec3f(0.84, 0.91, 0.90);
    let grid_opacity = 0.8;

    return mix(bg_color, grid_color, grid_line * grid_opacity);
  }

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
    let pixel = input.position.xy;
    let glass_center = vec2f(uniforms.glass_center_x, uniforms.glass_center_y);

    // Vector from glass center to pixel
    let to_pixel = pixel - glass_center;
    let distance_from_center = length(to_pixel);

    // Distance from edge (positive = inside glass)
    let distance_from_edge = uniforms.glass_radius - distance_from_center;

    // Outside glass - render normal background
    if (distance_from_edge < 0.0) {
      return vec4f(sample_background(pixel, uniforms.time), 1.0);
    }

    // Calculate bezel width in pixels (matching displacement map calculation)
    let bezel_pixels = (uniforms.bezel_width / 110.0) * uniforms.glass_radius;

    // Inside flat center - no refraction
    if (distance_from_edge >= bezel_pixels) {
      return vec4f(sample_background(pixel, uniforms.time), 1.0);
    }

    // In bezel region - apply refraction
    let bezel_t = distance_from_edge / bezel_pixels;  // 0 at edge, 1 at inner edge

    // Get displacement magnitude
    let displacement = calculate_displacement(
      bezel_t,
      uniforms.surface_type,
      bezel_pixels,
      uniforms.glass_thickness
    ) * uniforms.scale_ratio;

    // Direction from center (normalized)
    let direction = to_pixel / max(distance_from_center, 0.001);

    // Apply displacement (rays bend toward center for convex glass)
    let displaced_pixel = pixel - direction * displacement;

    // Sample background at displaced position
    let color = sample_background(displaced_pixel, uniforms.time);

    return vec4f(color, 1.0);
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
