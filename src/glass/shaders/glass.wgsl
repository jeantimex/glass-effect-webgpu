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
  grid_cell_size: f32,
  grid_speed: f32,
  specular_opacity: f32,
  specular_angle: f32,
  bg_brightness: f32,
  device_pixel_ratio: f32,
  specular_saturation: f32,
  specular_type: f32,
  progressive_blur_type: f32,
  scale_x: f32,
  scale_y: f32,
  blur_amount: f32,
  shadow_opacity: f32,
  shadow_blur: f32,
  shadow_offset_x: f32,
  shadow_offset_y: f32,
  progressive_blur: f32,
  glass_bg_opacity: f32,
  refractive_index: f32,
  magnifying_scale: f32,
  use_image_bg: f32,
  grid_offset: f32,
  shape_type: f32,
  rect_width: f32,
  rect_height: f32,
  rect_radius: f32,
  blur_type: f32,
  glass_tint_r: f32,
  glass_tint_g: f32,
  glass_tint_b: f32,
  switch_mode: f32,
  slider_mode: f32,
  switch_progress: f32,
  switch_track_width: f32,
  switch_track_height: f32,
  switch_center_x: f32,
  switch_center_y: f32,
  switch_track_off_opacity: f32,
  switch_track_on_opacity: f32,
  max_displacement_scale: f32,
  split_menu_mode: f32,
  split_menu_progress: f32,
  liquid_enabled: f32,
  icon_type: f32,
  icon_opacity: f32,
  icon_scale: f32,
  icon_color_r: f32,
  icon_color_g: f32,
  icon_color_b: f32,
  article_mode: f32,
  chromatic_aberration: f32,
  chromatic_strength: f32,
  chromatic_base: f32,
  player_controls_mode: f32,
  side_circle_offset: f32,
  side_circle_scale: f32,
  active_circle_index: f32,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var bg_texture: texture_2d<f32>;
@group(0) @binding(2) var bg_sampler: sampler;
@group(0) @binding(3) var icon_texture: texture_2d<f32>;
@group(0) @binding(4) var icon_sampler: sampler;

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
  let convex = pow(1.0 - pow(1.0 - x * 2.0, 4.0), 0.25);
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
  let x1 = max(x - dx, 0.0);
  let x2 = min(x + dx, 1.0);
  let y1 = get_surface_height(x1, surface_type);
  let y2 = get_surface_height(x2, surface_type);
  return (y2 - y1) / max(x2 - x1, 0.000001);
}

// Refraction using Snell's law
// Returns displacement amount for a ray hitting surface at bezel position x
fn calculate_displacement(bezel_t: f32, surface_type: f32, bezel_width: f32, glass_thickness: f32, refractive_index: f32) -> f32 {
  let eta = 1.0 / refractive_index;  // air to glass

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

// Adjust color saturation (saturation > 1 = more saturated, < 1 = desaturated)
fn adjust_saturation(color: vec3f, saturation: f32) -> vec3f {
  let luminance = dot(color, vec3f(0.299, 0.587, 0.114));
  return mix(vec3f(luminance), color, saturation);
}

fn glass_tint_color() -> vec3f {
  return vec3f(uniforms.glass_tint_r, uniforms.glass_tint_g, uniforms.glass_tint_b);
}

fn apply_glass_theme(color: vec3f) -> vec3f {
  let tint = glass_tint_color();
  let tint_luminance = dot(tint, vec3f(0.299, 0.587, 0.114));

  if (tint_luminance < 0.5) {
    return clamp(color * 0.9 - vec3f(0.3), vec3f(0.0), vec3f(1.0));
  }

  return clamp(color * 1.03 + vec3f(0.2), vec3f(0.0), vec3f(1.0));
}

fn apply_glass_tint(color: vec3f) -> vec3f {
  let themed_color = mix(color, apply_glass_theme(color), uniforms.glass_bg_opacity);
  return mix(themed_color, glass_tint_color(), uniforms.glass_bg_opacity);
}

fn smin(a: f32, b: f32, k: f32) -> f32 {
  let h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

fn hash12(p: vec2f) -> f32 {
  var p3 = fract(vec3f(p.x, p.y, p.x) * 0.1031);
  p3 = p3 + vec3f(dot(p3, p3.yzx + vec3f(33.33)));
  return fract((p3.x + p3.y) * p3.z);
}

fn value_noise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);

  let a = hash12(i);
  let b = hash12(i + vec2f(1.0, 0.0));
  let c = hash12(i + vec2f(0.0, 1.0));
  let d = hash12(i + vec2f(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

fn frost_noise(pixel: vec2f) -> f32 {
  let p = pixel / max(uniforms.device_pixel_ratio, 1.0);
  let fine = value_noise(p * 0.115);
  let medium = value_noise(p * 0.043 + vec2f(19.7, 4.3));
  let broad = value_noise(p * 0.017 + vec2f(3.1, 28.4));
  return clamp(fine * 0.52 + medium * 0.33 + broad * 0.15, 0.0, 1.0);
}

fn texture_cover_uv(pixel: vec2f) -> vec2f {
  let uv = pixel / vec2f(uniforms.canvas_width, uniforms.canvas_height);
  let tex_size = vec2f(textureDimensions(bg_texture));
  let canvas_size = vec2f(uniforms.canvas_width, uniforms.canvas_height);
  let canvas_aspect = canvas_size.x / canvas_size.y;
  let tex_aspect = tex_size.x / tex_size.y;

  var cover_uv = uv;
  if (canvas_aspect > tex_aspect) {
    let scale = canvas_aspect / tex_aspect;
    cover_uv.y = (uv.y - 0.5) / scale + 0.5;
  } else {
    let scale = tex_aspect / canvas_aspect;
    cover_uv.x = (uv.x - 0.5) / scale + 0.5;
  }

  return cover_uv;
}

fn sample_image_background(pixel: vec2f, mip_level: f32) -> vec3f {
  return textureSampleLevel(bg_texture, bg_sampler, texture_cover_uv(pixel), mip_level).rgb;
}

fn sample_image_frosted(pixel: vec2f, blur: f32) -> vec3f {
  let frost_strength = clamp(blur / 100.0, 0.0, 1.0);
  let frost = frost_noise(pixel);
  let mip_level = clamp(blur * 0.075 + frost * frost_strength * 2.5, 0.0, 10.0);
  let scatter_radius = (blur * 0.35 + blur * blur * 0.004) * (0.55 + frost * 0.65);

  let angle = hash12(floor(pixel * 0.031)) * 6.2831853;
  let s = sin(angle);
  let c = cos(angle);
  let axis_x = vec2f(c, s);
  let axis_y = vec2f(-s, c);

  var color = sample_image_background(pixel, mip_level) * 0.32;
  color += sample_image_background(pixel + (axis_x * 0.52 + axis_y * 0.18) * scatter_radius, mip_level + 0.35) * 0.12;
  color += sample_image_background(pixel - (axis_x * 0.52 + axis_y * 0.18) * scatter_radius, mip_level + 0.35) * 0.12;
  color += sample_image_background(pixel + (-axis_x * 0.21 + axis_y * 0.64) * scatter_radius, mip_level + 0.70) * 0.10;
  color += sample_image_background(pixel - (-axis_x * 0.21 + axis_y * 0.64) * scatter_radius, mip_level + 0.70) * 0.10;
  color += sample_image_background(pixel + (axis_x * 0.88 - axis_y * 0.38) * scatter_radius, mip_level + 1.00) * 0.08;
  color += sample_image_background(pixel - (axis_x * 0.88 - axis_y * 0.38) * scatter_radius, mip_level + 1.00) * 0.08;
  color += sample_image_background(pixel + (axis_x * 0.08 + axis_y * 1.05) * scatter_radius, mip_level + 1.25) * 0.04;
  color += sample_image_background(pixel - (axis_x * 0.08 + axis_y * 1.05) * scatter_radius, mip_level + 1.25) * 0.04;

  let haze = vec3f(dot(color, vec3f(0.299, 0.587, 0.114)));
  color = mix(color, haze, frost_strength * 0.08);
  color = color + vec3f((frost - 0.5) * frost_strength * 0.025);

  return color * uniforms.bg_brightness;
}

// Sample background with blur effect
fn sample_background_blurred(pixel: vec2f, time: f32, blur: f32) -> vec3f {
  // Use the internal function that applies blur softening to grid
  return apply_track_overlay(pixel, sample_background_internal(pixel, time, blur));
}

// Calculate specular highlight intensity
fn calculate_specular(
  distance_from_edge: f32,
  bezel_pixels: f32,
  direction: vec2f,
  specular_angle: f32
) -> f32 {
  // Specular rim width scales with device pixel ratio
  let rim_width = uniforms.device_pixel_ratio;
  if (distance_from_edge > rim_width) {
    return 0.0;
  }

  // Specular light direction vector
  let specular_dir = vec2f(cos(specular_angle), sin(specular_angle));

  // Surface normal direction (pointing outward from center)
  let normal_2d = vec2f(direction.x, -direction.y);

  // Dot product - how aligned is the surface with the light direction
  let dot_product = abs(dot(normal_2d, specular_dir));

  // Rim coefficient - matches reference: sqrt(1 - (1 - t)^2) where t = distance/rim_width
  let t = distance_from_edge / rim_width;
  let rim_coefficient = sqrt(1.0 - (1.0 - t) * (1.0 - t));

  // Final intensity = dotProduct * rimCoefficient, squared for sharper falloff
  let intensity = dot_product * rim_coefficient;

  return intensity * intensity;
}

fn calculate_layered_specular(
  distance_from_edge: f32,
  direction: vec2f,
  specular_angle: f32
) -> f32 {
  let rim_width = uniforms.device_pixel_ratio;
  if (distance_from_edge > rim_width) {
    return 0.0;
  }

  let specular_dir = vec2f(cos(specular_angle), sin(specular_angle));
  let normal_2d = vec2f(direction.x, -direction.y);
  let dot_product = abs(dot(normal_2d, specular_dir));
  let t = distance_from_edge / rim_width;
  let rim_coefficient = sqrt(1.0 - (1.0 - t) * (1.0 - t));
  let intensity = dot_product * rim_coefficient;

  return intensity * intensity;
}

fn rounded_rect_sdf(p: vec2f, half_size: vec2f, radius: f32) -> f32 {
  let q = abs(p) - half_size + vec2f(radius);
  return length(max(q, vec2f(0.0))) + min(max(q.x, q.y), 0.0) - radius;
}

fn track_mask(pixel: vec2f) -> f32 {
  let track_p = pixel - vec2f(uniforms.switch_center_x, uniforms.switch_center_y);
  let track_sdf = rounded_rect_sdf(
    track_p,
    vec2f(uniforms.switch_track_width, uniforms.switch_track_height) * 0.5,
    uniforms.switch_track_height * 0.5
  );
  return 1.0 - smoothstep(-1.0, 1.0, track_sdf);
}

fn apply_switch_track(pixel: vec2f, color: vec3f) -> vec3f {
  if (uniforms.switch_mode < 0.5) {
    return color;
  }

  let track_mask_value = track_mask(pixel);
  let off_color = vec3f(0.66, 0.67, 0.71);
  let on_color = vec3f(0.23, 0.75, 0.31);
  let track_color = mix(off_color, on_color, uniforms.switch_progress);
  let track_opacity = mix(uniforms.switch_track_off_opacity, uniforms.switch_track_on_opacity, uniforms.switch_progress);

  return mix(color, track_color, track_mask_value * track_opacity);
}

fn apply_slider_track(pixel: vec2f, color: vec3f) -> vec3f {
  if (uniforms.slider_mode < 0.5) {
    return color;
  }

  let track_p = pixel - vec2f(uniforms.switch_center_x, uniforms.switch_center_y);
  let track_mask_value = track_mask(pixel);
  let off_color = vec3f(0.537, 0.537, 0.561);
  let on_color = vec3f(0.012, 0.467, 0.969);
  let track_left = -uniforms.switch_track_width * 0.5 + uniforms.switch_track_height * 0.5;
  let track_right = uniforms.switch_track_width * 0.5 - uniforms.switch_track_height * 0.5;
  let fill_x = mix(track_left, track_right, uniforms.switch_progress);
  let fill_mask = (1.0 - smoothstep(fill_x - 1.0, fill_x + 1.0, track_p.x)) * track_mask_value;

  var track_color = mix(color, off_color, track_mask_value * uniforms.switch_track_off_opacity);
  track_color = mix(track_color, on_color, fill_mask * uniforms.switch_track_on_opacity);
  return track_color;
}

fn apply_track_overlay(pixel: vec2f, color: vec3f) -> vec3f {
  let switch_color = apply_switch_track(pixel, color);
  return apply_slider_track(pixel, switch_color);
}

fn apply_icon_overlay(pixel: vec2f, color: vec3f) -> vec3f {
  if (uniforms.icon_type < 0.5) {
    return color;
  }

  let glass_center = vec2f(uniforms.glass_center_x, uniforms.glass_center_y);
  let to_pixel = pixel - glass_center;
  
  // Icon size is relative to glass radius
  let icon_size = uniforms.glass_radius * uniforms.icon_scale * 2.0;
  let icon_uv = to_pixel / icon_size + vec2f(0.5);

  if (icon_uv.x < 0.0 || icon_uv.x > 1.0 || icon_uv.y < 0.0 || icon_uv.y > 1.0) {
    return color;
  }

  let icon_sample = textureSampleLevel(icon_texture, icon_sampler, icon_uv, 0.0);

  // Use the max of RGB or Alpha as the mask to be robust against icon colors
  let mask = max(icon_sample.a, max(max(icon_sample.r, icon_sample.g), icon_sample.b));

  // Use uniform icon color
  let icon_color = vec3f(uniforms.icon_color_r, uniforms.icon_color_g, uniforms.icon_color_b);

  // Simple alpha blending
  return mix(color, icon_color, mask * uniforms.icon_opacity);
}

fn shape_signed_distance(p: vec2f) -> f32 {
  let scaled_p = p / vec2f(uniforms.scale_x, uniforms.scale_y);

  if (uniforms.split_menu_mode > 0.5) {
    let progress = uniforms.split_menu_progress;
    // The menu splits into a circle on left and rounded rect on right
    // Final separation distance (distance between centers)
    let split_dist = 320.0 * uniforms.device_pixel_ratio * progress;

    // Animate width from a circle (base_height) to target width
    let target_width = uniforms.rect_width;
    let current_width = mix(uniforms.glass_radius * 2.0, target_width, progress);

    // Calculate symmetric offsets to center the whole group
    let offset_x = (uniforms.glass_radius - current_width * 0.5) * 0.5;
    let split_dist_left = offset_x - split_dist * 0.5;
    let split_dist_right = offset_x + split_dist * 0.5;

    // Circle component (left)
    let circle_p = scaled_p - vec2f(split_dist_left, 0.0);
    let d_circle = length(circle_p) - uniforms.glass_radius;

    // Rect component (right)
    let rect_p = scaled_p - vec2f(split_dist_right, 0.0);
    let current_radius = uniforms.glass_radius;
    
    let d_rect = rounded_rect_sdf(
      rect_p,
      vec2f(current_width, uniforms.glass_radius * 2.0) * 0.5,
      current_radius
    );

    if (uniforms.liquid_enabled > 0.5) {
      let k = 80.0 * uniforms.device_pixel_ratio * (1.0 - progress * 0.8);
      return smin(d_circle, d_rect, k);
    } else {
      return min(d_circle, d_rect);
    }
  }

  if (uniforms.shape_type > 0.5) {
    return rounded_rect_sdf(
      scaled_p,
      vec2f(uniforms.rect_width, uniforms.rect_height) * 0.5,
      uniforms.rect_radius
    );
  }

  return length(scaled_p) - uniforms.glass_radius;
}

fn shape_normal(p: vec2f) -> vec2f {
  let e = 1.0;
  let dx = shape_signed_distance(p + vec2f(e, 0.0)) - shape_signed_distance(p - vec2f(e, 0.0));
  let dy = shape_signed_distance(p + vec2f(0.0, e)) - shape_signed_distance(p - vec2f(0.0, e));
  let normal = vec2f(dx, dy);
  let normal_length = length(normal);

  if (normal_length < 0.001) {
    return normalize(p + vec2f(0.001, 0.0));
  }

  return normal / normal_length;
}

fn apply_magnifying_displacement(pixel: vec2f, center: vec2f, magnify_ratio: f32) -> vec2f {
  if (abs(uniforms.magnifying_scale) < 0.001) {
    return pixel;
  }

  let to_center = pixel - center;
  let magnify_displacement = to_center * (uniforms.magnifying_scale / magnify_ratio);
  return pixel - magnify_displacement;
}

fn get_shape_half_height() -> f32 {
  return select(uniforms.glass_radius, uniforms.rect_height * 0.5, uniforms.shape_type > 0.5);
}

fn calculate_progressive_blur(to_pixel: vec2f, bezel_t: f32) -> f32 {
  if (uniforms.progressive_blur_type > 0.5) {
    let half_height = get_shape_half_height();
    let normalized_y = clamp((to_pixel.y + half_height) / (half_height * 2.0), 0.0, 1.0);
    let band_width = 0.18;
    let top_band = 1.0 - smoothstep(0.0, band_width, normalized_y);
    let bottom_band = smoothstep(1.0 - band_width, 1.0, normalized_y);
    let band_mask = max(top_band, bottom_band);
    return uniforms.blur_amount + uniforms.progressive_blur * 50.0 * band_mask;
  }

  let edge_factor = 1.0 - bezel_t;
  return uniforms.blur_amount + edge_factor * uniforms.progressive_blur * 50.0;
}

// Sample background at a pixel position (blur parameter softens grid lines)
fn sample_background_internal(pixel: vec2f, time: f32, blur: f32) -> vec3f {
  let uv = pixel / vec2f(uniforms.canvas_width, uniforms.canvas_height);

  // If using image background, sample from texture with cover mode
  if (uniforms.use_image_bg > 0.5) {
    if (uniforms.blur_type < 0.5) {
      let mip_level = blur * 0.1;
      return sample_image_background(pixel, mip_level) * uniforms.bg_brightness;
    }

    return sample_image_frosted(pixel, blur);
  }

  // Gradient colors (teal to pink) - more saturated
  let color_tl = vec3f(0.20, 0.78, 0.76);
  let color_mid = vec3f(0.55, 0.74, 0.73);
  let color_br = vec3f(0.92, 0.65, 0.65);

  let t = clamp((uv.x + uv.y) * 0.5, 0.0, 1.0);
  var bg_color: vec3f;
  if (t < 0.5) {
    bg_color = mix(color_tl, color_mid, t * 2.0);
  } else {
    bg_color = mix(color_mid, color_br, (t - 0.5) * 2.0);
  }

  // Grid - fixed pixel size for cells
  let grid_size = uniforms.grid_cell_size;
  let base_line_width = 3.0;
  let anim_offset = time * uniforms.grid_speed + uniforms.grid_offset;
  let grid_pixel = pixel - vec2f(anim_offset, anim_offset);

  let grid_x = abs(fract(grid_pixel.x / grid_size) - 0.5) * 2.0;
  let grid_y = abs(fract(grid_pixel.y / grid_size) - 0.5) * 2.0;

  let frost_strength = clamp(blur / 100.0, 0.0, 1.0);
  let frost = frost_noise(pixel);
  let local_blur = select(blur, blur * (0.76 + frost * 0.58), uniforms.blur_type > 0.5);

  // Blur makes lines thicker and edges softer, with fine variation like a frosted surface.
  let blur_spread = local_blur * 0.2;
  let line_width = base_line_width + blur_spread;
  let line_threshold = 1.0 - (line_width / grid_size);

  // Edge softness increases with blur
  let edge_width = 0.02 + local_blur * 0.003;
  let grid_line_x = smoothstep(line_threshold - edge_width, line_threshold + edge_width, grid_x);
  let grid_line_y = smoothstep(line_threshold - edge_width, line_threshold + edge_width, grid_y);
  let grid_line = max(grid_line_x, grid_line_y);

  let grid_color = vec3f(0.84, 0.91, 0.90);
  // Reduce grid contrast/opacity with blur (colors blend together)
  // At blur=100, grid is completely invisible
  let blur_fade = max(0.0, 1.0 - local_blur * 0.015);
  let grid_opacity = 0.8 * blur_fade;

  // Also blend background colors toward average at high blur
  let blur_color_blend = min(1.0, local_blur * 0.01);
  let avg_color = (color_tl + color_mid + color_br) / 3.0;
  bg_color = mix(bg_color, avg_color, blur_color_blend);

  var final_color = mix(bg_color, grid_color, grid_line * grid_opacity);
  if (uniforms.blur_type > 0.5) {
    final_color = mix(final_color, avg_color, frost_strength * 0.08 * frost);
    final_color = final_color + vec3f((frost - 0.5) * frost_strength * 0.025);
  }

  // Brightness: 0=black, 1=normal, 2=2x bright
  return final_color * uniforms.bg_brightness;
}

fn sample_background(pixel: vec2f, time: f32) -> vec3f {
  return apply_track_overlay(pixel, sample_background_internal(pixel, time, 0.0));
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

struct CircleInfo {
  center: vec2f,
  radius: f32,
  inside: bool,
  index: i32,
}

fn get_scale_for_circle(circle_index: i32) -> vec2f {
  // Only apply deformation to the active circle
  if (uniforms.player_controls_mode > 0.5 && circle_index != i32(uniforms.active_circle_index)) {
    return vec2f(1.0, 1.0);
  }
  return vec2f(uniforms.scale_x, uniforms.scale_y);
}

// Signed distance to the combined player controls shape (3 circles with smooth blending)
fn player_controls_sdf(pixel: vec2f, main_center: vec2f, main_radius: f32) -> f32 {
  let side_radius = main_radius * uniforms.side_circle_scale;
  let left_center = vec2f(main_center.x - uniforms.side_circle_offset, main_center.y);
  let right_center = vec2f(main_center.x + uniforms.side_circle_offset, main_center.y);

  // Get scale for each circle (only active circle gets deformation)
  let scale_left = get_scale_for_circle(0);
  let scale_center = get_scale_for_circle(1);
  let scale_right = get_scale_for_circle(2);

  // Calculate signed distance to each circle
  let d_left = length((pixel - left_center) / scale_left) - side_radius;
  let d_center = length((pixel - main_center) / scale_center) - main_radius;
  let d_right = length((pixel - right_center) / scale_right) - side_radius;

  // Smooth blend factor - higher = smoother blend
  let k = 40.0 * uniforms.device_pixel_ratio;

  // Combine all three circles with smooth minimum
  return smin(smin(d_left, d_center, k), d_right, k);
}

// Get the direction/normal for player controls (for refraction)
fn player_controls_normal(pixel: vec2f, main_center: vec2f, main_radius: f32) -> vec2f {
  let eps = 1.0;
  let d = player_controls_sdf(pixel, main_center, main_radius);
  let dx = player_controls_sdf(pixel + vec2f(eps, 0.0), main_center, main_radius) - d;
  let dy = player_controls_sdf(pixel + vec2f(0.0, eps), main_center, main_radius) - d;
  return normalize(vec2f(dx, dy));
}

fn get_active_circle(pixel: vec2f, main_center: vec2f, main_radius: f32) -> CircleInfo {
  if (uniforms.player_controls_mode < 0.5) {
    return CircleInfo(main_center, main_radius, true, 1);
  }

  // Use combined SDF for player controls
  let sdf = player_controls_sdf(pixel, main_center, main_radius);
  let inside = sdf <= 0.0;

  // Determine which circle is closest (for per-circle effects)
  let side_radius = main_radius * uniforms.side_circle_scale;
  let left_center = vec2f(main_center.x - uniforms.side_circle_offset, main_center.y);
  let right_center = vec2f(main_center.x + uniforms.side_circle_offset, main_center.y);

  let dist_left = length(pixel - left_center) - side_radius;
  let dist_center = length(pixel - main_center) - main_radius;
  let dist_right = length(pixel - right_center) - side_radius;

  var closest_index = 1;
  if (dist_left < dist_center && dist_left < dist_right) {
    closest_index = 0;
  } else if (dist_right < dist_center && dist_right < dist_left) {
    closest_index = 2;
  }

  return CircleInfo(main_center, main_radius, inside, closest_index);
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4f {
  let pixel = input.position.xy;
  let main_center = vec2f(uniforms.glass_center_x, uniforms.glass_center_y);
  let main_radius = uniforms.glass_radius;

  // Get which circle this pixel belongs to
  let circle = get_active_circle(pixel, main_center, main_radius);
  let glass_center = circle.center;
  let effective_radius = circle.radius;

  let shape_reference = select(effective_radius, min(uniforms.rect_width, uniforms.rect_height) * 0.5, uniforms.shape_type > 0.5);
  let magnified_pixel = apply_magnifying_displacement(pixel, glass_center, shape_reference);

  let to_pixel = pixel - glass_center;

  // For player controls, use combined SDF; otherwise use shape_signed_distance
  var distance_from_edge: f32;
  if (uniforms.player_controls_mode > 0.5) {
    // Use smooth-blended SDF for metaball effect
    distance_from_edge = -player_controls_sdf(pixel, main_center, main_radius);
  } else {
    distance_from_edge = -shape_signed_distance(to_pixel);
  }

  // Outside glass - render background with shadow
  if (distance_from_edge < 0.0) {
    var bg = sample_background(pixel, uniforms.time);

    // Calculate shadow
    if (uniforms.shadow_opacity > 0.0) {
      let shadow_blur = max(uniforms.shadow_blur, 1.0);
      var shadow_alpha = 0.0;

      if (uniforms.player_controls_mode > 0.5) {
        // Use combined SDF for smooth merged shadow
        let shadow_offset = vec2f(uniforms.shadow_offset_x, uniforms.shadow_offset_y);
        let shadow_sdf = player_controls_sdf(pixel - shadow_offset, main_center, main_radius);
        shadow_alpha = smoothstep(shadow_blur, -shadow_blur * 0.5, shadow_sdf) * uniforms.shadow_opacity;
      } else {
        let shadow_center = glass_center + vec2f(uniforms.shadow_offset_x, uniforms.shadow_offset_y);
        let shadow_edge = -shape_signed_distance(pixel - shadow_center);
        shadow_alpha = smoothstep(-shadow_blur, shadow_blur * 0.5, shadow_edge) * uniforms.shadow_opacity;
      }

      // Darken background where shadow is
      bg = mix(bg, vec3f(0.0), shadow_alpha);
    }

    return vec4f(bg, 1.0);
  }

  // Circular demos use the old 110px reference radius. Rounded-rect filters
  // define bezelWidth directly in the filter/object coordinate space.
  let circle_bezel_pixels = (uniforms.bezel_width / 110.0) * shape_reference;
  let rect_bezel_pixels = min(uniforms.bezel_width, shape_reference);
  let bezel_pixels = select(circle_bezel_pixels, rect_bezel_pixels, uniforms.shape_type > 0.5);

  // Inside flat center - no refraction, but apply blur and magnification
  if (distance_from_edge >= bezel_pixels) {
    // Progressive blur: minimal blur in center
    let center_blur = calculate_progressive_blur(to_pixel, 1.0);
    var center_color = sample_background_blurred(magnified_pixel, uniforms.time, center_blur);
    center_color = apply_glass_tint(center_color);
    center_color = apply_icon_overlay(pixel, center_color);
    return vec4f(center_color, 1.0);
  }

  // In bezel region - apply refraction
  let bezel_t = distance_from_edge / bezel_pixels;  // 0 at edge, 1 at inner edge

  // Get displacement magnitude
  // The 0.5 factor matches SVG feDisplacementMap behavior (uses XC - 0.5 formula)
  // Scale circular demos by their 110px reference radius. Rounded rectangles
  // already operate in object pixels, matching the SVG displacement map.
  let displacement_scale = select(shape_reference / 110.0, 1.0, uniforms.shape_type > 0.5);
  let raw_displacement = calculate_displacement(
    bezel_t,
    uniforms.surface_type,
    uniforms.bezel_width,
    uniforms.glass_thickness,
    uniforms.refractive_index
  ) * uniforms.scale_ratio * 0.5 * displacement_scale;

  // Limit extreme sampling. Rounded-rect UI controls need more room than the
  // circular demo because their SVG filters can pull color across the full rim.
  let max_displacement = bezel_pixels * uniforms.max_displacement_scale;
  let displacement = min(raw_displacement, max_displacement);

  // Direction from the nearest shape edge toward this pixel.
  var direction: vec2f;
  if (uniforms.player_controls_mode > 0.5) {
    direction = player_controls_normal(pixel, main_center, main_radius);
  } else {
    direction = shape_normal(to_pixel);
  }

  // Apply displacement (rays bend toward center for convex glass)
  var displaced_pixel = magnified_pixel - direction * displacement;

  // Progressive blur: more blur toward edges (bezel_t: 0=edge, 1=inner)
  let progressive_blur = calculate_progressive_blur(to_pixel, bezel_t);

  // Sample background at displaced position (with optional blur)
  var color: vec3f;

  if (uniforms.chromatic_aberration > 0.5) {
    // Chromatic aberration: sample R, G, B at different offsets
    // Red refracts less, blue refracts more (dispersion)
    let aberration_amount = displacement * uniforms.chromatic_strength * uniforms.chromatic_base;
    let displaced_r = magnified_pixel - direction * (displacement - aberration_amount);
    let displaced_g = magnified_pixel - direction * displacement;
    let displaced_b = magnified_pixel - direction * (displacement + aberration_amount);

    let r = sample_background_blurred(displaced_r, uniforms.time, progressive_blur).r;
    let g = sample_background_blurred(displaced_g, uniforms.time, progressive_blur).g;
    let b = sample_background_blurred(displaced_b, uniforms.time, progressive_blur).b;
    color = vec3f(r, g, b);
  } else {
    color = sample_background_blurred(displaced_pixel, uniforms.time, progressive_blur);
  }

  color = apply_glass_tint(color);

  // Apply icon overlay
  color = apply_icon_overlay(pixel, color);

  // Calculate and apply specular highlight
  if (uniforms.specular_type > 0.5) {
    let specular_intensity = calculate_layered_specular(
      distance_from_edge,
      direction,
      uniforms.specular_angle
    );
    let specular_color = vec3f(1.0, 1.0, 1.0);
    color = mix(color, specular_color, specular_intensity * uniforms.specular_opacity);
  } else {
    let specular_intensity = calculate_specular(
      distance_from_edge,
      bezel_pixels,
      direction,
      uniforms.specular_angle
    );

    // Apply saturation boost where specular is visible
    let saturated_color = adjust_saturation(color, uniforms.specular_saturation);
    color = mix(color, saturated_color, specular_intensity);

    // Blend specular highlight (white) on top of the saturated color
    let specular_color = vec3f(1.0, 1.0, 1.0);
    color = mix(color, specular_color, specular_intensity * uniforms.specular_opacity);
  }

  return vec4f(color, 1.0);
}
