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
  left_circle_size: f32,
  center_circle_size: f32,
  right_circle_size: f32,
  player_controls_group_liquid: f32,
  circle_preset_mode: f32,
  circle_preset_strategy: f32,
  circle_preset_count: f32,
  circle_preset_active_index: f32,
  // Per-circle shadow params (left)
  left_shadow_opacity: f32,
  left_shadow_blur: f32,
  left_shadow_offset_x: f32,
  left_shadow_offset_y: f32,
  // Per-circle shadow params (center)
  center_shadow_opacity: f32,
  center_shadow_blur: f32,
  center_shadow_offset_x: f32,
  center_shadow_offset_y: f32,
  // Per-circle shadow params (right)
  right_shadow_opacity: f32,
  right_shadow_blur: f32,
  right_shadow_offset_x: f32,
  right_shadow_offset_y: f32,
  circle_preset_shadow_opacity: f32,
  circle_preset_shadow_blur: f32,
  circle_preset_shadow_offset_x: f32,
  circle_preset_shadow_offset_y: f32,
  // Split menu per-item shadow params
  active_split_menu_index: f32,
  split_circle_shadow_opacity: f32,
  split_circle_shadow_blur: f32,
  split_circle_shadow_offset_x: f32,
  split_circle_shadow_offset_y: f32,
  split_rect_shadow_opacity: f32,
  split_rect_shadow_blur: f32,
  split_rect_shadow_offset_x: f32,
  split_rect_shadow_offset_y: f32,
  // Split menu pill settings
  split_menu_pill_width: f32,
  split_menu_pill_height: f32,
  split_menu_pill_radius: f32,
}

// Per-instance data for circle preset mode (64 floats = 256 bytes per instance)
struct CircleInstanceData {
  // Position & size (vec4)
  center_x: f32,
  center_y: f32,
  size: f32,
  shape_type: f32,

  // Rect dimensions (vec4)
  rect_width: f32,
  rect_height: f32,
  rect_radius: f32,
  _pad0: f32,

  // Surface & refraction (vec4 + vec4)
  surface_type: f32,
  bezel_width: f32,
  glass_thickness: f32,
  refractive_index: f32,
  magnifying_scale: f32,
  scale_ratio: f32,
  max_displacement_scale: f32,
  _pad1: f32,

  // Shadow (vec4)
  shadow_opacity: f32,
  shadow_blur: f32,
  shadow_offset_x: f32,
  shadow_offset_y: f32,

  // Blur (vec4)
  blur_amount: f32,
  blur_type: f32,
  progressive_blur: f32,
  progressive_blur_type: f32,

  // Specular (vec4)
  specular_opacity: f32,
  specular_angle: f32,
  specular_saturation: f32,
  specular_type: f32,

  // Glass tint (vec4)
  glass_tint_r: f32,
  glass_tint_g: f32,
  glass_tint_b: f32,
  glass_bg_opacity: f32,

  // Icon (vec4 + vec4)
  icon_type: f32,
  icon_opacity: f32,
  icon_scale: f32,
  icon_color_r: f32,
  icon_color_g: f32,
  icon_color_b: f32,
  _pad2: f32,
  _pad3: f32,

  // Chromatic aberration (vec4)
  chromatic_aberration: f32,
  chromatic_strength: f32,
  chromatic_base: f32,
  _pad4: f32,

  // Layer & state (vec4)
  layer_index: f32,
  is_active: f32,
  scale_x: f32,
  scale_y: f32,

  // Extra properties (vec4)
  pressed_glass_bg_opacity: f32,
  _pad5: f32,
  _pad6: f32,
  _pad7: f32,

  // Padding to reach 64 floats (vec4 * 3)
  _pad8: f32,
  _pad9: f32,
  _pad10: f32,
  _pad11: f32,
  _pad12: f32,
  _pad13: f32,
  _pad14: f32,
  _pad15: f32,
  _pad16: f32,
  _pad17: f32,
  _pad18: f32,
  _pad19: f32,
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
@group(0) @binding(5) var icon_left_texture: texture_2d<f32>;
@group(0) @binding(6) var icon_right_texture: texture_2d<f32>;
@group(0) @binding(7) var<storage, read> circle_instances: array<CircleInstanceData, 8>;

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
fn calculate_displacement(bezel_t: f32, surface_type: f32, bezel_width: f32, glass_thickness: f32, refractive_index: f32) -> f32 {
  let eta = 1.0 / refractive_index;

  let height = get_surface_height(bezel_t, surface_type);
  let derivative = get_surface_derivative(bezel_t, surface_type);

  let magnitude = sqrt(derivative * derivative + 1.0);
  let normal_x = -derivative / magnitude;
  let normal_y = -1.0 / magnitude;

  let dot_ni = normal_y;
  let k = 1.0 - eta * eta * (1.0 - dot_ni * dot_ni);

  if (k < 0.0) {
    return 0.0;
  }

  let k_sqrt = sqrt(k);
  let refracted_x = -(eta * dot_ni + k_sqrt) * normal_x;
  let refracted_y = eta - (eta * dot_ni + k_sqrt) * normal_y;

  let remaining_height = height * bezel_width + glass_thickness;

  if (abs(refracted_y) < 0.001) {
    return 0.0;
  }

  return refracted_x * (remaining_height / refracted_y);
}

fn adjust_saturation(color: vec3f, saturation: f32) -> vec3f {
  let luminance = dot(color, vec3f(0.299, 0.587, 0.114));
  return mix(vec3f(luminance), color, saturation);
}

fn glass_tint_color() -> vec3f {
  return vec3f(uniforms.glass_tint_r, uniforms.glass_tint_g, uniforms.glass_tint_b);
}

fn instance_glass_tint_color(inst: CircleInstanceData) -> vec3f {
  return vec3f(inst.glass_tint_r, inst.glass_tint_g, inst.glass_tint_b);
}

fn apply_glass_theme(color: vec3f) -> vec3f {
  let tint = glass_tint_color();
  let tint_luminance = dot(tint, vec3f(0.299, 0.587, 0.114));

  if (tint_luminance < 0.5) {
    return clamp(color * 0.9 - vec3f(0.3), vec3f(0.0), vec3f(1.0));
  }

  return clamp(color * 1.03 + vec3f(0.2), vec3f(0.0), vec3f(1.0));
}

fn apply_instance_glass_theme(color: vec3f, inst: CircleInstanceData) -> vec3f {
  let tint = instance_glass_tint_color(inst);
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

fn apply_instance_glass_tint(color: vec3f, inst: CircleInstanceData) -> vec3f {
  let themed_color = mix(color, apply_instance_glass_theme(color, inst), inst.glass_bg_opacity);
  return mix(themed_color, instance_glass_tint_color(inst), inst.glass_bg_opacity);
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

fn sample_background_blurred(pixel: vec2f, time: f32, blur: f32) -> vec3f {
  return apply_track_overlay(pixel, sample_background_internal(pixel, time, blur));
}

fn calculate_specular(
  distance_from_edge: f32,
  bezel_pixels: f32,
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
  let track_right = uniforms.switch_track_width * 0.5;
  let fill_x = mix(track_left, track_right, uniforms.switch_progress);
  let fill_enabled = select(0.0, 1.0, uniforms.switch_progress > 0.0);
  let fill_mask = (1.0 - smoothstep(fill_x - 1.0, fill_x + 1.0, track_p.x)) * track_mask_value * fill_enabled;

  var track_color = mix(color, off_color, track_mask_value * uniforms.switch_track_off_opacity);
  track_color = mix(track_color, on_color, fill_mask * uniforms.switch_track_on_opacity);
  return track_color;
}

fn apply_track_overlay(pixel: vec2f, color: vec3f) -> vec3f {
  let switch_color = apply_switch_track(pixel, color);
  return apply_slider_track(pixel, switch_color);
}

fn sample_icon_for_circle(icon_uv: vec2f, circle_index: i32) -> vec4f {
  if (circle_index == 0) {
    return textureSampleLevel(icon_left_texture, icon_sampler, icon_uv, 0.0);
  } else if (circle_index == 2) {
    return textureSampleLevel(icon_right_texture, icon_sampler, icon_uv, 0.0);
  }
  return textureSampleLevel(icon_texture, icon_sampler, icon_uv, 0.0);
}

fn apply_player_controls_icons(pixel: vec2f, color: vec3f) -> vec3f {
  let main_center = vec2f(uniforms.glass_center_x, uniforms.glass_center_y);
  let left_center = vec2f(main_center.x - uniforms.side_circle_offset, main_center.y);
  let right_center = vec2f(main_center.x + uniforms.side_circle_offset, main_center.y);

  let left_radius = get_player_circle_radius(0);
  let center_radius = get_player_circle_radius(1);
  let right_radius = get_player_circle_radius(2);

  let icon_color = vec3f(uniforms.icon_color_r, uniforms.icon_color_g, uniforms.icon_color_b);
  var result = color;

  let left_icon_size = left_radius * uniforms.icon_scale * 2.0;
  let left_uv = (pixel - left_center) / left_icon_size + vec2f(0.5);
  if (left_uv.x >= 0.0 && left_uv.x <= 1.0 && left_uv.y >= 0.0 && left_uv.y <= 1.0) {
    let sample = sample_icon_for_circle(left_uv, 0);
    let mask = max(sample.a, max(max(sample.r, sample.g), sample.b));
    result = mix(result, icon_color, mask * uniforms.icon_opacity);
  }

  let center_icon_size = center_radius * uniforms.icon_scale * 2.0;
  let center_uv = (pixel - main_center) / center_icon_size + vec2f(0.5);
  if (center_uv.x >= 0.0 && center_uv.x <= 1.0 && center_uv.y >= 0.0 && center_uv.y <= 1.0) {
    let sample = sample_icon_for_circle(center_uv, 1);
    let mask = max(sample.a, max(max(sample.r, sample.g), sample.b));
    result = mix(result, icon_color, mask * uniforms.icon_opacity);
  }

  let right_icon_size = right_radius * uniforms.icon_scale * 2.0;
  let right_uv = (pixel - right_center) / right_icon_size + vec2f(0.5);
  if (right_uv.x >= 0.0 && right_uv.x <= 1.0 && right_uv.y >= 0.0 && right_uv.y <= 1.0) {
    let sample = sample_icon_for_circle(right_uv, 2);
    let mask = max(sample.a, max(max(sample.r, sample.g), sample.b));
    result = mix(result, icon_color, mask * uniforms.icon_opacity);
  }

  return result;
}

fn apply_icon_overlay(pixel: vec2f, color: vec3f, center: vec2f, radius: f32) -> vec3f {
  if (uniforms.icon_type < 0.5) {
    return color;
  }

  if (uniforms.player_controls_mode > 0.5) {
    return apply_player_controls_icons(pixel, color);
  }

  let to_pixel = pixel - center;
  let icon_size = radius * uniforms.icon_scale * 2.0;
  let icon_uv = to_pixel / icon_size + vec2f(0.5);

  if (icon_uv.x < 0.0 || icon_uv.x > 1.0 || icon_uv.y < 0.0 || icon_uv.y > 1.0) {
    return color;
  }

  let icon_sample = textureSampleLevel(icon_texture, icon_sampler, icon_uv, 0.0);
  let mask = max(icon_sample.a, max(max(icon_sample.r, icon_sample.g), icon_sample.b));
  let icon_color = vec3f(uniforms.icon_color_r, uniforms.icon_color_g, uniforms.icon_color_b);

  return mix(color, icon_color, mask * uniforms.icon_opacity);
}

fn apply_instance_icon_overlay(pixel: vec2f, color: vec3f, center: vec2f, radius: f32, inst: CircleInstanceData) -> vec3f {
  if (inst.icon_type < 0.5) {
    return color;
  }

  let to_pixel = pixel - center;
  let icon_size = radius * inst.icon_scale * 2.0;
  let icon_uv = to_pixel / icon_size + vec2f(0.5);

  if (icon_uv.x < 0.0 || icon_uv.x > 1.0 || icon_uv.y < 0.0 || icon_uv.y > 1.0) {
    return color;
  }

  let icon_sample = textureSampleLevel(icon_texture, icon_sampler, icon_uv, 0.0);
  let mask = max(icon_sample.a, max(max(icon_sample.r, icon_sample.g), icon_sample.b));
  let icon_color = vec3f(inst.icon_color_r, inst.icon_color_g, inst.icon_color_b);

  return mix(color, icon_color, mask * inst.icon_opacity);
}

fn shape_signed_distance(p: vec2f) -> f32 {
  let scaled_p = p / vec2f(uniforms.scale_x, uniforms.scale_y);

  if (uniforms.split_menu_mode > 0.5) {
    let progress = uniforms.split_menu_progress;
    let split_dist = 320.0 * uniforms.device_pixel_ratio * progress;

    let pill_width = uniforms.split_menu_pill_width;
    let pill_height = uniforms.split_menu_pill_height;
    let pill_radius = min(uniforms.split_menu_pill_radius, min(pill_width, pill_height) * 0.5);

    let current_width = mix(uniforms.glass_radius * 2.0, pill_width, progress);
    let current_height = mix(uniforms.glass_radius * 2.0, pill_height, progress);
    let current_radius = mix(uniforms.glass_radius, pill_radius, progress);
    let circle_radius = current_height * 0.5;

    let offset_x = (uniforms.glass_radius - current_width * 0.5) * 0.5;
    let split_dist_left = offset_x - split_dist * 0.5;
    let split_dist_right = offset_x + split_dist * 0.5;

    let circle_p = p - vec2f(split_dist_left, 0.0);
    let d_circle = length(circle_p) - circle_radius;

    let rect_p = p - vec2f(split_dist_right, 0.0);

    let d_rect = rounded_rect_sdf(
      rect_p,
      vec2f(current_width, current_height) * 0.5,
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

fn apply_instance_magnifying_displacement(pixel: vec2f, center: vec2f, magnify_ratio: f32, inst: CircleInstanceData) -> vec2f {
  if (abs(inst.magnifying_scale) < 0.001) {
    return pixel;
  }

  let to_center = pixel - center;
  let magnify_displacement = to_center * (inst.magnifying_scale / magnify_ratio);
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

fn calculate_instance_progressive_blur(to_pixel: vec2f, bezel_t: f32, inst: CircleInstanceData) -> f32 {
  let half_height = select(
    min(uniforms.canvas_width, uniforms.canvas_height) * 0.35 * inst.size,
    inst.rect_height * 0.5 * inst.size,
    inst.shape_type > 0.5
  );

  if (inst.progressive_blur_type > 0.5) {
    let normalized_y = clamp((to_pixel.y + half_height) / (half_height * 2.0), 0.0, 1.0);
    let band_width = 0.18;
    let top_band = 1.0 - smoothstep(0.0, band_width, normalized_y);
    let bottom_band = smoothstep(1.0 - band_width, 1.0, normalized_y);
    let band_mask = max(top_band, bottom_band);
    return inst.blur_amount + inst.progressive_blur * 50.0 * band_mask;
  }

  let edge_factor = 1.0 - bezel_t;
  return inst.blur_amount + edge_factor * inst.progressive_blur * 50.0;
}

fn sample_background_internal(pixel: vec2f, time: f32, blur: f32) -> vec3f {
  let uv = pixel / vec2f(uniforms.canvas_width, uniforms.canvas_height);

  if (uniforms.use_image_bg > 0.5) {
    if (uniforms.blur_type < 0.5) {
      let mip_level = blur * 0.1;
      return sample_image_background(pixel, mip_level) * uniforms.bg_brightness;
    }

    return sample_image_frosted(pixel, blur);
  }

  let color_tl = vec3f(0.78, 0.78, 0.78);
  let color_mid = vec3f(0.70, 0.70, 0.70);
  let color_br = vec3f(0.76, 0.76, 0.76);

  let t = clamp((uv.x + uv.y) * 0.5, 0.0, 1.0);
  var bg_color: vec3f;
  if (t < 0.5) {
    bg_color = mix(color_tl, color_mid, t * 2.0);
  } else {
    bg_color = mix(color_mid, color_br, (t - 0.5) * 2.0);
  }

  let grid_size = uniforms.grid_cell_size;
  let base_line_width = 3.0;
  let anim_offset = time * uniforms.grid_speed + uniforms.grid_offset;
  let grid_pixel = pixel - vec2f(anim_offset, anim_offset);

  let grid_x = abs(fract(grid_pixel.x / grid_size) - 0.5) * 2.0;
  let grid_y = abs(fract(grid_pixel.y / grid_size) - 0.5) * 2.0;

  let frost_strength = clamp(blur / 100.0, 0.0, 1.0);
  let frost = frost_noise(pixel);
  let local_blur = select(blur, blur * (0.76 + frost * 0.58), uniforms.blur_type > 0.5);

  let blur_spread = local_blur * 0.2;
  let line_width = base_line_width + blur_spread;
  let line_threshold = 1.0 - (line_width / grid_size);

  let edge_width = 0.02 + local_blur * 0.003;
  let grid_line_x = smoothstep(line_threshold - edge_width, line_threshold + edge_width, grid_x);
  let grid_line_y = smoothstep(line_threshold - edge_width, line_threshold + edge_width, grid_y);
  let grid_line = max(grid_line_x, grid_line_y);

  let blur_color_blend = min(1.0, local_blur * 0.01);
  let avg_color = (color_tl + color_mid + color_br) / 3.0;
  bg_color = mix(bg_color, avg_color, blur_color_blend);

  let checker_index = i32(floor(grid_pixel.x / grid_size) + floor(grid_pixel.y / grid_size));
  let checker_color = select(vec3f(0.71, 0.71, 0.71), vec3f(0.78, 0.78, 0.78), checker_index % 2 == 0);
  bg_color = mix(bg_color, checker_color, 0.92);

  var final_color = bg_color;
  if (uniforms.blur_type > 0.5) {
    final_color = mix(final_color, avg_color, frost_strength * 0.08 * frost);
    final_color = final_color + vec3f((frost - 0.5) * frost_strength * 0.025);
  }

  return final_color * uniforms.bg_brightness;
}

fn sample_background(pixel: vec2f, time: f32) -> vec3f {
  return apply_track_overlay(pixel, sample_background_internal(pixel, time, 0.0));
}

fn sample_background_with_blur_type(pixel: vec2f, time: f32, blur: f32, blur_type: f32) -> vec3f {
  let uv = pixel / vec2f(uniforms.canvas_width, uniforms.canvas_height);

  if (uniforms.use_image_bg > 0.5) {
    if (blur_type < 0.5) {
      let mip_level = blur * 0.1;
      return sample_image_background(pixel, mip_level) * uniforms.bg_brightness;
    }
    return sample_image_frosted(pixel, blur);
  }

  return sample_background_internal(pixel, time, blur);
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
  if (uniforms.circle_preset_mode > 0.5) {
    let inst = circle_instances[circle_index];
    if (inst.is_active < 0.5) {
      return vec2f(1.0, 1.0);
    }
    return vec2f(inst.scale_x, inst.scale_y);
  }

  if (
    uniforms.player_controls_mode > 0.5 &&
    uniforms.player_controls_group_liquid < 0.5 &&
    circle_index != i32(uniforms.active_circle_index)
  ) {
    return vec2f(1.0, 1.0);
  }
  return vec2f(uniforms.scale_x, uniforms.scale_y);
}

fn get_player_base_radius() -> f32 {
  return min(uniforms.canvas_width, uniforms.canvas_height) * 0.35;
}

fn get_player_circle_radius(circle_index: i32) -> f32 {
  let base = get_player_base_radius();
  if (circle_index == 0) {
    return base * uniforms.left_circle_size;
  } else if (circle_index == 2) {
    return base * uniforms.right_circle_size;
  }
  return base * uniforms.center_circle_size;
}

// Circle instance functions using per-instance data
fn get_instance_base_radius(inst: CircleInstanceData) -> f32 {
  if (inst.shape_type > 0.5) {
    return max(inst.rect_width, inst.rect_height) * 0.5;
  }
  return min(uniforms.canvas_width, uniforms.canvas_height) * 0.35;
}

fn get_instance_radius(inst: CircleInstanceData) -> f32 {
  if (inst.shape_type > 0.5) {
    return min(inst.rect_width, inst.rect_height) * 0.5 * inst.size;
  }
  return get_instance_base_radius(inst) * inst.size;
}

fn get_instance_center(inst: CircleInstanceData) -> vec2f {
  return vec2f(inst.center_x, inst.center_y);
}

fn get_instance_scale(inst: CircleInstanceData) -> vec2f {
  if (inst.is_active < 0.5) {
    return vec2f(1.0, 1.0);
  }
  return vec2f(inst.scale_x, inst.scale_y);
}

fn instance_item_sdf(pixel: vec2f, circle_index: i32) -> f32 {
  let inst = circle_instances[circle_index];
  let center = get_instance_center(inst);
  let scale = get_instance_scale(inst);
  let scaled_p = (pixel - center) / scale;

  if (inst.shape_type > 0.5) {
    let half_size = vec2f(inst.rect_width, inst.rect_height) * 0.5 * inst.size;
    let radius = min(inst.rect_radius, min(inst.rect_width, inst.rect_height) * 0.5) * inst.size;
    return rounded_rect_sdf(scaled_p, half_size, radius);
  }

  let base_radius = min(uniforms.canvas_width, uniforms.canvas_height) * 0.35;
  return length(scaled_p) - base_radius * inst.size;
}

fn instance_item_normal(pixel: vec2f, circle_index: i32) -> vec2f {
  let eps = 1.0;
  let d = instance_item_sdf(pixel, circle_index);
  let dx = instance_item_sdf(pixel + vec2f(eps, 0.0), circle_index) - d;
  let dy = instance_item_sdf(pixel + vec2f(0.0, eps), circle_index) - d;
  return normalize(vec2f(dx, dy));
}

fn instances_merged_sdf(pixel: vec2f) -> f32 {
  let count = i32(min(uniforms.circle_preset_count, 8.0));
  if (count <= 0) { return 1e9; }

  var result = 1e9;
  let k = 40.0 * uniforms.device_pixel_ratio;

  for (var i = 0; i < 8; i = i + 1) {
    if (i >= count) { break; }

    // Only merge circles on the same layer
    let inst = circle_instances[i];
    let d = instance_item_sdf(pixel, i);

    if (uniforms.circle_preset_strategy < 0.5) {
      // Stack strategy: no merging
      result = min(result, d);
    } else {
      // Merge strategy: smooth blend circles on same layer
      if (i == 0) {
        result = d;
      } else {
        let prev_inst = circle_instances[i - 1];
        if (inst.layer_index == prev_inst.layer_index) {
          result = smin(result, d, k);
        } else {
          result = min(result, d);
        }
      }
    }
  }
  return result;
}

fn instances_shadow_alpha(pixel: vec2f) -> f32 {
  let count = i32(min(uniforms.circle_preset_count, 8.0));
  var alpha = 0.0;

  for (var i = 0; i < 8; i = i + 1) {
    if (i >= count) { break; }

    let inst = circle_instances[i];
    let center = get_instance_center(inst);
    let scale = get_instance_scale(inst);

    let inside = instance_item_sdf(pixel, i);
    let shadow_offset = vec2f(inst.shadow_offset_x, inst.shadow_offset_y);
    let shadow_d = instance_item_sdf(pixel - shadow_offset, i);
    let shadow_blur_px = max(inst.shadow_blur, 1.0);
    let shadow_alpha = select(0.0, smoothstep(shadow_blur_px, -shadow_blur_px * 0.5, shadow_d) * inst.shadow_opacity, inside > 0.0);
    alpha = max(alpha, shadow_alpha);
  }

  return alpha;
}

fn instances_merged_normal(pixel: vec2f) -> vec2f {
  let eps = 1.0;
  let d = instances_merged_sdf(pixel);
  let dx = instances_merged_sdf(pixel + vec2f(eps, 0.0)) - d;
  let dy = instances_merged_sdf(pixel + vec2f(0.0, eps)) - d;
  return normalize(vec2f(dx, dy));
}

fn get_closest_instance(pixel: vec2f) -> CircleInfo {
  let count = i32(min(uniforms.circle_preset_count, 8.0));
  let sdf = instances_merged_sdf(pixel);
  let inside = sdf <= 0.0;

  var closest_index = 0;
  var closest_distance = 1e9;
  var closest_center = vec2f(uniforms.glass_center_x, uniforms.glass_center_y);
  var closest_radius = uniforms.glass_radius;

  for (var i = 0; i < 8; i = i + 1) {
    if (i >= count) { break; }

    let inst = circle_instances[i];
    let center = get_instance_center(inst);
    let radius = get_instance_radius(inst);
    let dist = instance_item_sdf(pixel, i);

    if (dist < closest_distance) {
      closest_distance = dist;
      closest_index = i;
      closest_center = center;
      closest_radius = radius;
    }
  }

  return CircleInfo(closest_center, closest_radius, inside, closest_index);
}

// Signed distance to the combined player controls shape
fn player_controls_sdf(pixel: vec2f, main_center: vec2f, main_radius: f32) -> f32 {
  let left_radius = get_player_circle_radius(0);
  let center_radius = get_player_circle_radius(1);
  let right_radius = get_player_circle_radius(2);

  let left_center = vec2f(main_center.x - uniforms.side_circle_offset, main_center.y);
  let right_center = vec2f(main_center.x + uniforms.side_circle_offset, main_center.y);

  let scale_left = get_scale_for_circle(0);
  let scale_center = get_scale_for_circle(1);
  let scale_right = get_scale_for_circle(2);

  let d_left = length((pixel - left_center) / scale_left) - left_radius;
  let d_center = length((pixel - main_center) / scale_center) - center_radius;
  let d_right = length((pixel - right_center) / scale_right) - right_radius;

  let k = 40.0 * uniforms.device_pixel_ratio;

  return smin(smin(d_left, d_center, k), d_right, k);
}

fn player_controls_shadow_alpha(pixel: vec2f, main_center: vec2f) -> f32 {
  let left_radius = get_player_circle_radius(0);
  let center_radius = get_player_circle_radius(1);
  let right_radius = get_player_circle_radius(2);

  let left_shadow_offset = vec2f(uniforms.left_shadow_offset_x, uniforms.left_shadow_offset_y);
  let center_shadow_offset = vec2f(uniforms.center_shadow_offset_x, uniforms.center_shadow_offset_y);
  let right_shadow_offset = vec2f(uniforms.right_shadow_offset_x, uniforms.right_shadow_offset_y);

  let left_center = vec2f(main_center.x - uniforms.side_circle_offset, main_center.y);
  let right_center = vec2f(main_center.x + uniforms.side_circle_offset, main_center.y);

  let scale_left = get_scale_for_circle(0);
  let scale_center = get_scale_for_circle(1);
  let scale_right = get_scale_for_circle(2);

  let inside_left = length((pixel - left_center) / scale_left) - left_radius;
  let inside_center = length((pixel - main_center) / scale_center) - center_radius;
  let inside_right = length((pixel - right_center) / scale_right) - right_radius;

  let left_blur = max(uniforms.left_shadow_blur, 1.0);
  let center_blur = max(uniforms.center_shadow_blur, 1.0);
  let right_blur = max(uniforms.right_shadow_blur, 1.0);

  let d_left = length((pixel - left_shadow_offset - left_center) / scale_left) - left_radius;
  let d_center = length((pixel - center_shadow_offset - main_center) / scale_center) - center_radius;
  let d_right = length((pixel - right_shadow_offset - right_center) / scale_right) - right_radius;

  let alpha_left = select(0.0, smoothstep(left_blur, -left_blur * 0.5, d_left) * uniforms.left_shadow_opacity, inside_left > 0.0);
  let alpha_center = select(0.0, smoothstep(center_blur, -center_blur * 0.5, d_center) * uniforms.center_shadow_opacity, inside_center > 0.0);
  let alpha_right = select(0.0, smoothstep(right_blur, -right_blur * 0.5, d_right) * uniforms.right_shadow_opacity, inside_right > 0.0);

  return max(max(alpha_left, alpha_center), alpha_right);
}

fn get_scale_for_split_item(item_index: i32) -> vec2f {
  if (uniforms.split_menu_mode > 0.5 && item_index != i32(uniforms.active_split_menu_index)) {
    return vec2f(1.0, 1.0);
  }
  return vec2f(uniforms.scale_x, uniforms.scale_y);
}

fn split_menu_shadow_alpha(pixel: vec2f, glass_center: vec2f) -> f32 {
  let dpr = uniforms.device_pixel_ratio;
  let progress = uniforms.split_menu_progress;
  let base_radius = uniforms.glass_radius;

  let pill_width = uniforms.split_menu_pill_width;
  let pill_height = uniforms.split_menu_pill_height;
  let pill_radius = min(uniforms.split_menu_pill_radius, min(pill_width, pill_height) * 0.5);

  let split_dist = 320.0 * dpr * progress;
  let current_width = mix(base_radius * 2.0, pill_width, progress);
  let current_height = mix(base_radius * 2.0, pill_height, progress);
  let current_radius = mix(base_radius, pill_radius, progress);
  let circle_radius = current_height * 0.5;

  let offset_x = (base_radius - current_width * 0.5) * 0.5;
  let split_dist_left = offset_x - split_dist * 0.5;
  let split_dist_right = offset_x + split_dist * 0.5;

  let circle_center = glass_center + vec2f(split_dist_left, 0.0);
  let rect_center = glass_center + vec2f(split_dist_right, 0.0);

  let circle_shadow_offset = vec2f(uniforms.split_circle_shadow_offset_x, uniforms.split_circle_shadow_offset_y);
  let rect_shadow_offset = vec2f(uniforms.split_rect_shadow_offset_x, uniforms.split_rect_shadow_offset_y);

  let scale_circle = get_scale_for_split_item(0);
  let scale_rect = get_scale_for_split_item(1);

  let circle_p = (pixel - circle_center) / scale_circle;
  let inside_circle = length(circle_p) - circle_radius;

  let rect_p = (pixel - rect_center) / scale_rect;
  let inside_rect = rounded_rect_sdf(rect_p, vec2f(current_width, current_height) * 0.5, current_radius);

  let circle_blur = max(uniforms.split_circle_shadow_blur, 1.0);
  let rect_blur = max(uniforms.split_rect_shadow_blur, 1.0);

  let shadow_circle_p = (pixel - circle_shadow_offset - circle_center) / scale_circle;
  let d_circle = length(shadow_circle_p) - circle_radius;

  let shadow_rect_p = (pixel - rect_shadow_offset - rect_center) / scale_rect;
  let d_rect = rounded_rect_sdf(shadow_rect_p, vec2f(current_width, current_height) * 0.5, current_radius);

  let alpha_circle = select(0.0, smoothstep(circle_blur, -circle_blur * 0.5, d_circle) * uniforms.split_circle_shadow_opacity, inside_circle > 0.0);
  let alpha_rect = select(0.0, smoothstep(rect_blur, -rect_blur * 0.5, d_rect) * uniforms.split_rect_shadow_opacity, inside_rect > 0.0);

  return max(alpha_circle, alpha_rect);
}

fn player_controls_normal(pixel: vec2f, main_center: vec2f, main_radius: f32) -> vec2f {
  let eps = 1.0;
  let d = player_controls_sdf(pixel, main_center, main_radius);
  let dx = player_controls_sdf(pixel + vec2f(eps, 0.0), main_center, main_radius) - d;
  let dy = player_controls_sdf(pixel + vec2f(0.0, eps), main_center, main_radius) - d;
  return normalize(vec2f(dx, dy));
}

fn get_active_circle(pixel: vec2f, main_center: vec2f, main_radius: f32) -> CircleInfo {
  if (uniforms.circle_preset_mode > 0.5) {
    return get_closest_instance(pixel);
  }

  if (uniforms.player_controls_mode < 0.5) {
    return CircleInfo(main_center, main_radius, true, 1);
  }

  let sdf = player_controls_sdf(pixel, main_center, main_radius);
  let inside = sdf <= 0.0;

  let left_radius = get_player_circle_radius(0);
  let center_radius = get_player_circle_radius(1);
  let right_radius = get_player_circle_radius(2);
  let left_center = vec2f(main_center.x - uniforms.side_circle_offset, main_center.y);
  let right_center = vec2f(main_center.x + uniforms.side_circle_offset, main_center.y);

  let dist_left = length(pixel - left_center) - left_radius;
  let dist_center = length(pixel - main_center) - center_radius;
  let dist_right = length(pixel - right_center) - right_radius;

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

  let circle = get_active_circle(pixel, main_center, main_radius);
  let glass_center = circle.center;
  let effective_radius = circle.radius;

  let shape_reference = select(effective_radius, min(uniforms.rect_width, uniforms.rect_height) * 0.5, uniforms.shape_type > 0.5);

  // For circle preset mode, use per-instance properties
  if (uniforms.circle_preset_mode > 0.5) {
    let inst = circle_instances[circle.index];
    let inst_shape_ref = select(
      effective_radius,
      min(inst.rect_width, inst.rect_height) * 0.5,
      inst.shape_type > 0.5
    );

    let magnified_pixel = apply_instance_magnifying_displacement(pixel, glass_center, inst_shape_ref, inst);
    let to_pixel = pixel - glass_center;

    var distance_from_edge: f32;
    if (uniforms.circle_preset_strategy < 0.5) {
      distance_from_edge = -instance_item_sdf(pixel, circle.index);
    } else {
      distance_from_edge = -instances_merged_sdf(pixel);
    }

    // Handle shadows
    var bg = sample_background(pixel, uniforms.time);
    let shadow_alpha = instances_shadow_alpha(pixel);
    bg = mix(bg, vec3f(0.0), shadow_alpha);

    if (distance_from_edge < 0.0) {
      return vec4f(bg, 1.0);
    }

    // Calculate bezel
    let circle_bezel_pixels = (inst.bezel_width / 110.0) * inst_shape_ref;
    let rect_bezel_pixels = min(inst.bezel_width, inst_shape_ref);
    let bezel_pixels = select(circle_bezel_pixels, rect_bezel_pixels, inst.shape_type > 0.5);

    // Inside flat center
    if (distance_from_edge >= bezel_pixels) {
      let center_blur = calculate_instance_progressive_blur(to_pixel, 1.0, inst);
      var center_color = sample_background_with_blur_type(magnified_pixel, uniforms.time, center_blur, inst.blur_type);
      center_color = apply_instance_glass_tint(center_color, inst);
      center_color = apply_instance_icon_overlay(pixel, center_color, circle.center, circle.radius, inst);
      return vec4f(center_color, 1.0);
    }

    // In bezel region
    let bezel_t = distance_from_edge / bezel_pixels;

    let displacement_scale = select(inst_shape_ref / 110.0, 1.0, inst.shape_type > 0.5);
    let raw_displacement = calculate_displacement(
      bezel_t,
      inst.surface_type,
      inst.bezel_width,
      inst.glass_thickness,
      inst.refractive_index
    ) * inst.scale_ratio * 0.5 * displacement_scale;

    let max_displacement = bezel_pixels * inst.max_displacement_scale;
    let displacement = min(raw_displacement, max_displacement);

    var direction: vec2f;
    if (uniforms.circle_preset_strategy < 0.5) {
      direction = instance_item_normal(pixel, circle.index);
    } else {
      direction = instances_merged_normal(pixel);
    }

    var displaced_pixel = magnified_pixel - direction * displacement;
    let progressive_blur = calculate_instance_progressive_blur(to_pixel, bezel_t, inst);

    var color: vec3f;

    if (inst.chromatic_aberration > 0.5) {
      let aberration_amount = displacement * inst.chromatic_strength * inst.chromatic_base;
      let displaced_r = magnified_pixel - direction * (displacement - aberration_amount);
      let displaced_g = magnified_pixel - direction * displacement;
      let displaced_b = magnified_pixel - direction * (displacement + aberration_amount);

      let r = sample_background_with_blur_type(displaced_r, uniforms.time, progressive_blur, inst.blur_type).r;
      let g = sample_background_with_blur_type(displaced_g, uniforms.time, progressive_blur, inst.blur_type).g;
      let b = sample_background_with_blur_type(displaced_b, uniforms.time, progressive_blur, inst.blur_type).b;
      color = vec3f(r, g, b);
    } else {
      color = sample_background_with_blur_type(displaced_pixel, uniforms.time, progressive_blur, inst.blur_type);
    }

    color = apply_instance_glass_tint(color, inst);
    color = apply_instance_icon_overlay(pixel, color, glass_center, effective_radius, inst);

    // Apply specular
    if (inst.specular_type > 0.5) {
      let specular_intensity = calculate_layered_specular(distance_from_edge, direction, inst.specular_angle);
      let specular_color = vec3f(1.0, 1.0, 1.0);
      color = mix(color, specular_color, specular_intensity * inst.specular_opacity);
    } else {
      let specular_intensity = calculate_specular(distance_from_edge, bezel_pixels, direction, inst.specular_angle);
      let saturated_color = adjust_saturation(color, inst.specular_saturation);
      color = mix(color, saturated_color, specular_intensity);
      let specular_color = vec3f(1.0, 1.0, 1.0);
      color = mix(color, specular_color, specular_intensity * inst.specular_opacity);
    }

    return vec4f(color, 1.0);
  }

  // Non-circle-preset modes (original behavior)
  let magnified_pixel = apply_magnifying_displacement(pixel, glass_center, shape_reference);
  let to_pixel = pixel - glass_center;

  var distance_from_edge: f32;
  if (uniforms.player_controls_mode > 0.5) {
    distance_from_edge = -player_controls_sdf(pixel, main_center, main_radius);
  } else {
    distance_from_edge = -shape_signed_distance(to_pixel);
  }

  if (uniforms.player_controls_mode > 0.5) {
    var bg = sample_background(pixel, uniforms.time);
    let shadow_alpha = player_controls_shadow_alpha(pixel, main_center);
    bg = mix(bg, vec3f(0.0), shadow_alpha);

    if (distance_from_edge < 0.0) {
      return vec4f(bg, 1.0);
    }
  } else if (uniforms.split_menu_mode > 0.5) {
    var bg = sample_background(pixel, uniforms.time);
    let shadow_alpha = split_menu_shadow_alpha(pixel, glass_center);
    bg = mix(bg, vec3f(0.0), shadow_alpha);

    if (distance_from_edge < 0.0) {
      return vec4f(bg, 1.0);
    }
  } else {
    if (distance_from_edge < 0.0) {
      var bg = sample_background(pixel, uniforms.time);

      if (uniforms.shadow_opacity > 0.0) {
        let shadow_blur = max(uniforms.shadow_blur, 1.0);
        let shadow_center = glass_center + vec2f(uniforms.shadow_offset_x, uniforms.shadow_offset_y);
        let shadow_edge = -shape_signed_distance(pixel - shadow_center);
        let shadow_alpha = smoothstep(-shadow_blur, shadow_blur * 0.5, shadow_edge) * uniforms.shadow_opacity;
        bg = mix(bg, vec3f(0.0), shadow_alpha);
      }

      return vec4f(bg, 1.0);
    }
  }

  let circle_bezel_pixels = (uniforms.bezel_width / 110.0) * shape_reference;
  let rect_bezel_pixels = min(uniforms.bezel_width, shape_reference);
  let bezel_pixels = select(circle_bezel_pixels, rect_bezel_pixels, uniforms.shape_type > 0.5);

  if (distance_from_edge >= bezel_pixels) {
    let center_blur = calculate_progressive_blur(to_pixel, 1.0);
    var center_color = sample_background_blurred(magnified_pixel, uniforms.time, center_blur);
    center_color = apply_glass_tint(center_color);
    center_color = apply_icon_overlay(pixel, center_color, circle.center, circle.radius);
    return vec4f(center_color, 1.0);
  }

  let bezel_t = distance_from_edge / bezel_pixels;

  let displacement_scale = select(shape_reference / 110.0, 1.0, uniforms.shape_type > 0.5);
  let raw_displacement = calculate_displacement(
    bezel_t,
    uniforms.surface_type,
    uniforms.bezel_width,
    uniforms.glass_thickness,
    uniforms.refractive_index
  ) * uniforms.scale_ratio * 0.5 * displacement_scale;

  let max_displacement = bezel_pixels * uniforms.max_displacement_scale;
  let displacement = min(raw_displacement, max_displacement);

  var direction: vec2f;
  if (uniforms.player_controls_mode > 0.5) {
    direction = player_controls_normal(pixel, main_center, main_radius);
  } else {
    direction = shape_normal(to_pixel);
  }

  var displaced_pixel = magnified_pixel - direction * displacement;
  let progressive_blur = calculate_progressive_blur(to_pixel, bezel_t);

  var color: vec3f;

  if (uniforms.chromatic_aberration > 0.5) {
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
  color = apply_icon_overlay(pixel, color, glass_center, effective_radius);

  if (uniforms.specular_type > 0.5) {
    let specular_intensity = calculate_layered_specular(distance_from_edge, direction, uniforms.specular_angle);
    let specular_color = vec3f(1.0, 1.0, 1.0);
    color = mix(color, specular_color, specular_intensity * uniforms.specular_opacity);
  } else {
    let specular_intensity = calculate_specular(distance_from_edge, bezel_pixels, direction, uniforms.specular_angle);
    let saturated_color = adjust_saturation(color, uniforms.specular_saturation);
    color = mix(color, saturated_color, specular_intensity);
    let specular_color = vec3f(1.0, 1.0, 1.0);
    color = mix(color, specular_color, specular_intensity * uniforms.specular_opacity);
  }

  return vec4f(color, 1.0);
}
