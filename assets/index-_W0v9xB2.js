var $=Object.defineProperty;var j=(i,e,t)=>e in i?$(i,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):i[e]=t;var d=(i,e,t)=>j(i,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))s(r);new MutationObserver(r=>{for(const a of r)if(a.type==="childList")for(const n of a.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&s(n)}).observe(document,{childList:!0,subtree:!0});function t(r){const a={};return r.integrity&&(a.integrity=r.integrity),r.referrerPolicy&&(a.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?a.credentials="include":r.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function s(r){if(r.ep)return;r.ep=!0;const a=t(r);fetch(r.href,a)}})();const L="/glass-effect-webgpu/",W={leaves:`${L}assets/leaves.jpg`,banner:`${L}assets/banner.jpeg`};function Q(){return{bezelWidth:60,glassThickness:50,scaleRatio:1,surfaceType:0,gridCellSize:105,gridSpeed:40,specularOpacity:.4,specularAngle:Math.PI/3,bgBrightness:1,specularSaturation:4,specularType:0,scaleX:1,scaleY:1,blurAmount:0,blurType:1,shadowOpacity:.1,shadowBlur:30,shadowOffsetX:0,shadowOffsetY:15,progressiveBlur:0,progressiveBlurType:0,glassBgOpacity:0,refractiveIndex:1.5,magnifyingScale:0,circleSize:1,shapeType:0,rectWidth:420,rectHeight:96,rectRadiusPercent:100,glassTintR:1,glassTintG:1,glassTintB:1,useImageBg:!1,switchMode:!1,sliderMode:!1,switchProgress:1,switchTrackWidth:160,switchTrackHeight:67,switchTrackOffOpacity:.34,switchTrackOnOpacity:.86,maxDisplacementScale:.8,splitMenuMode:!1,splitMenuProgress:0,liquidEnabled:!0,iconType:0,iconOpacity:.8,iconScale:.45,iconColorR:1,iconColorG:1,iconColorB:1,articleMode:!1}}function K(i){const e=window.devicePixelRatio||1,t=i.clientWidth*e,s=i.clientHeight*e;(i.width!==t||i.height!==s)&&(i.width=t,i.height=s)}function R(i,e){return Math.min(i.width,i.height)*.35*e.circleSize}function E(i){const e=window.devicePixelRatio||1,t=i.rectWidth*e,s=i.rectHeight*e,r=Math.min(Math.max(i.rectRadiusPercent,0),100)/100,a=Math.min(t,s)*.5*r;return{width:t,height:s,radius:a}}function Z(i,e){if(e.shapeType===1){const s=E(e);return{halfWidth:s.width/2,halfHeight:s.height/2}}const t=R(i,e);return{halfWidth:t,halfHeight:t}}function z(i,e,t,s){const r=window.devicePixelRatio||1,a=e.switchTrackWidth*r,n=e.switchTrackHeight*r,c=e.rectWidth*r,l=e.rectHeight*r,p=t*i.width,o=s*i.height,h=5*r,m=Math.max(0,a-Math.max(n,Math.min(c,l))-h*2);return{centerX:p,centerY:o,trackWidth:a,trackHeight:n,travel:m}}function C(i,e,t){const s=i.getBoundingClientRect(),r=i.width/s.width,a=i.height/s.height;return{x:(e-s.left)*r,y:(t-s.top)*a}}function G(i,e,t,s,r){const a=Math.abs(i)-(t/2-r),n=Math.abs(e)-(s/2-r),c=Math.max(a,0),l=Math.max(n,0),p=Math.min(Math.max(a,n),0);return Math.sqrt(c*c+l*l)+p-r}function J(i,e,t,s,r,a){const n=C(i,r,a),c=t*i.width,l=s*i.height,p=n.x-c,o=n.y-l;if(e.shapeType===1){const h=E(e);return G(p,o,h.width,h.height,h.radius)<=0}return Math.sqrt(p*p+o*o)<=R(i,e)}function ee(i,e,t,s,r,a){const n=C(i,r,a),c=t*i.width,l=s*i.height,p=window.devicePixelRatio||1,o=(n.x-c)/e.scaleX,h=(n.y-l)/e.scaleY,m=R(i,e),y=m*2,w=e.splitMenuProgress,P=320*p*w,x=e.rectWidth*p,f=y+(x-y)*w,_=(m-f*.5)*.5,b=_-P*.5,T=_+P*.5;if(Math.sqrt((o-b)**2+h**2)<=m)return!0;const q=y*.5;return G(o-T,h,f,y,q)<=0}function te(i,e,t,s,r,a){if(!e.switchMode&&!e.sliderMode)return!1;const n=C(i,r,a),c=z(i,e,t,s),l=c.trackHeight/2;return G(n.x-c.centerX,n.y-c.centerY,c.trackWidth,c.trackHeight,l)<=0}const se=`struct Uniforms {
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

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4f {
  let pixel = input.position.xy;
  let glass_center = vec2f(uniforms.glass_center_x, uniforms.glass_center_y);
  let shape_reference = select(uniforms.glass_radius, min(uniforms.rect_width, uniforms.rect_height) * 0.5, uniforms.shape_type > 0.5);
  let magnified_pixel = apply_magnifying_displacement(pixel, glass_center, shape_reference);

  let to_pixel = pixel - glass_center;
  let distance_from_edge = -shape_signed_distance(to_pixel);

  // Outside glass - render background with shadow
  if (distance_from_edge < 0.0) {
    // In article mode, render transparent outside the glass
    if (uniforms.article_mode > 0.5) {
      // Only render shadow
      if (uniforms.shadow_opacity > 0.0) {
        let shadow_center = glass_center + vec2f(uniforms.shadow_offset_x, uniforms.shadow_offset_y);
        let shadow_edge = -shape_signed_distance(pixel - shadow_center);
        let shadow_blur = max(uniforms.shadow_blur, 1.0);
        let shadow_alpha = smoothstep(-shadow_blur, shadow_blur * 0.5, shadow_edge) * uniforms.shadow_opacity;
        return vec4f(0.0, 0.0, 0.0, shadow_alpha);
      }
      return vec4f(0.0, 0.0, 0.0, 0.0);
    }

    var bg = sample_background(pixel, uniforms.time);

    // Calculate shadow
    if (uniforms.shadow_opacity > 0.0) {
      let shadow_center = glass_center + vec2f(uniforms.shadow_offset_x, uniforms.shadow_offset_y);
      let shadow_edge = -shape_signed_distance(pixel - shadow_center);

      // Soft shadow falloff
      let shadow_blur = max(uniforms.shadow_blur, 1.0);
      let shadow_alpha = smoothstep(-shadow_blur, shadow_blur * 0.5, shadow_edge) * uniforms.shadow_opacity;

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
    // In article mode, render semi-transparent glass tint
    if (uniforms.article_mode > 0.5) {
      let tint = glass_tint_color();
      var center_color = mix(vec3f(0.9), tint, uniforms.glass_bg_opacity);
      center_color = apply_icon_overlay(pixel, center_color);
      return vec4f(center_color, 0.85);
    }

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
  let direction = shape_normal(to_pixel);

  // Apply displacement (rays bend toward center for convex glass)
  var displaced_pixel = magnified_pixel - direction * displacement;

  // Progressive blur: more blur toward edges (bezel_t: 0=edge, 1=inner)
  let progressive_blur = calculate_progressive_blur(to_pixel, bezel_t);

  // Sample background at displaced position (with optional blur)
  var color: vec3f;
  if (uniforms.article_mode > 0.5) {
    // In article mode, use tinted transparent glass
    let tint = glass_tint_color();
    color = mix(vec3f(0.9), tint, uniforms.glass_bg_opacity);
  } else {
    color = sample_background_blurred(displaced_pixel, uniforms.time, progressive_blur);
    color = apply_glass_tint(color);
  }

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

  let alpha = select(1.0, 0.85, uniforms.article_mode > 0.5);
  return vec4f(color, alpha);
}
`;function ie(i,e,t){const s=i.createShaderModule({code:se}),r=i.createPipelineLayout({bindGroupLayouts:[t]});return i.createRenderPipeline({layout:r,vertex:{module:s,entryPoint:"vs_main"},fragment:{module:s,entryPoint:"fs_main",targets:[{format:e}]},primitive:{topology:"triangle-strip"}})}function re(i){return i.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:2,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}},{binding:3,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float"}},{binding:4,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}}]})}function ae(i,e,t,s,r,a,n){return i.createBindGroup({layout:e,entries:[{binding:0,resource:{buffer:t}},{binding:1,resource:s.createView()},{binding:2,resource:r},{binding:3,resource:a.createView()},{binding:4,resource:n}]})}class ne{constructor(e){d(this,"textureCache",new Map);this.device=e}async load(e){const t=this.textureCache.get(e);if(t)return t;const s=new Image;s.src=e,await s.decode();let r=s,a=s.width,n=s.height;if(e.toLowerCase().endsWith(".svg")){const p=document.createElement("canvas"),o=512;p.width=o,p.height=o;const h=p.getContext("2d");h&&(h.clearRect(0,0,o,o),h.fillStyle="white",h.fillRect(0,0,o,o),h.globalCompositeOperation="destination-in",h.drawImage(s,0,0,o,o),h.globalCompositeOperation="source-over",r=p,a=o,n=o)}const c=Math.floor(Math.log2(Math.max(a,n)))+1,l=this.device.createTexture({size:[a,n],format:"rgba8unorm",mipLevelCount:c,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});return this.device.queue.copyExternalImageToTexture({source:r},{texture:l},[a,n]),await this.generateMipmaps(l,c),this.textureCache.set(e,l),l}async generateMipmaps(e,t){const s=this.device.createShaderModule({code:`
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
      `}),r=this.device.createRenderPipeline({layout:"auto",vertex:{module:s,entryPoint:"vs"},fragment:{module:s,entryPoint:"fs",targets:[{format:"rgba8unorm"}]},primitive:{topology:"triangle-strip"}}),a=this.device.createSampler({minFilter:"linear",magFilter:"linear"});for(let n=1;n<t;n++){const c=e.createView({baseMipLevel:n-1,mipLevelCount:1}),l=e.createView({baseMipLevel:n,mipLevelCount:1}),p=this.device.createBindGroup({layout:r.getBindGroupLayout(0),entries:[{binding:0,resource:c},{binding:1,resource:a}]}),o=this.device.createCommandEncoder(),h=o.beginRenderPass({colorAttachments:[{view:l,loadOp:"clear",storeOp:"store"}]});h.setPipeline(r),h.setBindGroup(0,p),h.draw(4),h.end(),this.device.queue.submit([o.finish()])}}}const le=240;function ce(i){const{canvas:e,params:t}=i,s=R(e,t),r=E(t),a=(performance.now()-i.startTime)/1e3,n=window.devicePixelRatio||1;return new Float32Array([e.width,e.height,a,i.glassCenterX*e.width,i.glassCenterY*e.height,s,t.bezelWidth,t.glassThickness,t.scaleRatio,t.surfaceType,t.gridCellSize,t.gridSpeed,t.specularOpacity,t.specularAngle,t.bgBrightness,n,t.specularSaturation,t.specularType,t.progressiveBlurType,t.scaleX,t.scaleY,t.blurAmount,t.shadowOpacity,t.shadowBlur,t.shadowOffsetX,t.shadowOffsetY,t.progressiveBlur,t.glassBgOpacity,t.refractiveIndex,t.magnifyingScale,t.useImageBg?1:0,i.gridOffset,t.shapeType,r.width,r.height,r.radius,t.blurType,t.glassTintR,t.glassTintG,t.glassTintB,t.switchMode?1:0,t.sliderMode?1:0,t.switchProgress,t.switchTrackWidth*n,t.switchTrackHeight*n,i.switchCenterX*e.width,i.switchCenterY*e.height,t.switchTrackOffOpacity,t.switchTrackOnOpacity,t.maxDisplacementScale,t.splitMenuMode?1:0,t.splitMenuProgress,t.liquidEnabled?1:0,t.iconType,t.iconOpacity,t.iconScale,t.iconColorR,t.iconColorG,t.iconColorB,t.articleMode?1:0])}class oe{constructor(e){d(this,"device");d(this,"context");d(this,"format");d(this,"pipeline");d(this,"bindGroup");d(this,"uniformBuffer");d(this,"bgTexture");d(this,"bgSampler");d(this,"iconTexture");d(this,"iconSampler");d(this,"bindGroupLayout");d(this,"textureLoader");d(this,"startTime",performance.now());d(this,"backgroundRequestId",0);d(this,"iconRequestId",0);d(this,"glassCenterX",.5);d(this,"glassCenterY",.5);d(this,"gridOffset",0);d(this,"switchCenterX",.5);d(this,"switchCenterY",.5);d(this,"glassParams",Q());this.canvas=e}async init(){var t;const e=await((t=navigator.gpu)==null?void 0:t.requestAdapter());if(!e)throw new Error("WebGPU not supported");this.device=await e.requestDevice(),this.context=this.canvas.getContext("webgpu"),this.format=navigator.gpu.getPreferredCanvasFormat(),this.context.configure({device:this.device,format:this.format,alphaMode:"premultiplied"}),this.uniformBuffer=this.device.createBuffer({size:le,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),this.bgSampler=this.device.createSampler({magFilter:"linear",minFilter:"linear",mipmapFilter:"linear"}),this.iconSampler=this.device.createSampler({magFilter:"linear",minFilter:"linear",addressModeU:"clamp-to-edge",addressModeV:"clamp-to-edge"}),this.textureLoader=new ne(this.device),this.bgTexture=await this.textureLoader.load(W.leaves),this.iconTexture=this.createEmptyTexture(),this.bindGroupLayout=re(this.device),this.bindGroup=this.createRenderBindGroup(),this.pipeline=ie(this.device,this.format,this.bindGroupLayout),window.addEventListener("resize",()=>this.resizeCanvas()),this.resizeCanvas()}async setBackground(e){const t=++this.backgroundRequestId;if(e==="article"){this.glassParams.articleMode=!0,this.glassParams.useImageBg=!1;return}if(this.glassParams.articleMode=!1,e==="grid"){this.glassParams.useImageBg=!1;return}const s=await this.textureLoader.load(W[e]);t===this.backgroundRequestId&&(this.bgTexture=s,this.glassParams.useImageBg=!0,this.bindGroup=this.createRenderBindGroup())}async setIcon(e){const t=++this.iconRequestId;if(!e){this.iconTexture=this.createEmptyTexture(),this.bindGroup=this.createRenderBindGroup();return}const s=await this.textureLoader.load(e);t===this.iconRequestId&&(this.iconTexture=s,this.bindGroup=this.createRenderBindGroup())}setGridSpeed(e){const t=(performance.now()-this.startTime)/1e3,s=t*this.glassParams.gridSpeed+this.gridOffset;this.glassParams.gridSpeed=e,this.gridOffset=s-t*e}isPointInsideGlass(e,t){return this.glassParams.splitMenuMode?ee(this.canvas,this.glassParams,this.glassCenterX,this.glassCenterY,e,t):J(this.canvas,this.glassParams,this.glassCenterX,this.glassCenterY,e,t)}isPointInsideSwitchTrack(e,t){return te(this.canvas,this.glassParams,this.switchCenterX,this.switchCenterY,e,t)}setSwitchMode(e){this.glassParams.switchMode=e,e&&(this.glassParams.sliderMode=!1,this.switchCenterX=.5,this.switchCenterY=.5,this.setSwitchProgress(this.glassParams.switchProgress))}setSliderMode(e){this.glassParams.sliderMode=e,e&&(this.glassParams.switchMode=!1,this.switchCenterX=.5,this.switchCenterY=.5,this.setSwitchProgress(this.glassParams.switchProgress))}centerGlass(){this.glassCenterX=.5,this.glassCenterY=.5}getGlassCenterCssPosition(){return{x:this.glassCenterX*this.canvas.clientWidth,y:this.glassCenterY*this.canvas.clientHeight}}setSwitchProgress(e){if(this.glassParams.switchProgress=Math.min(Math.max(e,0),1),!this.glassParams.switchMode&&!this.glassParams.sliderMode)return;const t=z(this.canvas,this.glassParams,this.switchCenterX,this.switchCenterY),s=t.centerX+(this.glassParams.switchProgress-.5)*t.travel;this.glassCenterX=s/this.canvas.width,this.glassCenterY=t.centerY/this.canvas.height}getSwitchProgress(){return this.glassParams.switchProgress}setSwitchProgressFromClientX(e){const t=C(this.canvas,e,0),s=z(this.canvas,this.glassParams,this.switchCenterX,this.switchCenterY);s.travel<=0||this.setSwitchProgress((t.x-s.centerX)/s.travel+.5)}getGlassDragOffset(e,t){const s=C(this.canvas,e,t);return{x:s.x-this.glassCenterX*this.canvas.width,y:s.y-this.glassCenterY*this.canvas.height}}setGlassCenterFromClientPoint(e,t,s={x:0,y:0}){const r=C(this.canvas,e,t),a=Z(this.canvas,this.glassParams),n=Math.min(a.halfWidth,this.canvas.width/2),c=Math.max(this.canvas.width-a.halfWidth,this.canvas.width/2),l=Math.min(a.halfHeight,this.canvas.height/2),p=Math.max(this.canvas.height-a.halfHeight,this.canvas.height/2);this.glassCenterX=Math.min(Math.max(r.x-s.x,n),c)/this.canvas.width,this.glassCenterY=Math.min(Math.max(r.y-s.y,l),p)/this.canvas.height}render(){this.resizeCanvas(),(this.glassParams.switchMode||this.glassParams.sliderMode)&&this.setSwitchProgress(this.glassParams.switchProgress),this.device.queue.writeBuffer(this.uniformBuffer,0,ce({canvas:this.canvas,params:this.glassParams,startTime:this.startTime,glassCenterX:this.glassCenterX,glassCenterY:this.glassCenterY,switchCenterX:this.switchCenterX,switchCenterY:this.switchCenterY,gridOffset:this.gridOffset}));const e=this.device.createCommandEncoder(),t=this.glassParams.articleMode?{r:0,g:0,b:0,a:0}:{r:.1,g:.1,b:.12,a:1},s=e.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:t,loadOp:"clear",storeOp:"store"}]});s.setPipeline(this.pipeline),s.setBindGroup(0,this.bindGroup),s.draw(4),s.end(),this.device.queue.submit([e.finish()])}createRenderBindGroup(){return ae(this.device,this.bindGroupLayout,this.uniformBuffer,this.bgTexture,this.bgSampler,this.iconTexture,this.iconSampler)}createEmptyTexture(){const e=this.device.createTexture({size:[1,1],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});return this.device.queue.writeTexture({texture:e},new Uint8Array([0,0,0,0]),{bytesPerRow:4},{width:1,height:1}),e}resizeCanvas(){K(this.canvas)}}function u(i){const e=document.getElementById(i);if(!e)throw new Error(`Missing #${i}`);return e}function de(){return{presetSelect:u("presetType"),panelControls:u("panelControls"),bezelSlider:u("bezelWidth"),thicknessSlider:u("glassThickness"),scaleSlider:u("scaleRatio"),gridCellSizeSlider:u("gridCellSize"),gridSpeedSlider:u("gridSpeed"),refractiveIndexSlider:u("refractiveIndex"),magnifyingScaleSlider:u("magnifyingScale"),circleSizeSlider:u("circleSize"),iconTypeSelect:u("iconType"),iconOpacitySlider:u("iconOpacity"),iconScaleSlider:u("iconScale"),iconColorInput:u("iconColor"),rectWidthSlider:u("rectWidth"),rectHeightSlider:u("rectHeight"),rectRadiusSlider:u("rectRadius"),switchTrackWidthSlider:u("switchTrackWidth"),switchTrackHeightSlider:u("switchTrackHeight"),switchTrackOffOpacitySlider:u("switchTrackOffOpacity"),switchTrackOnOpacitySlider:u("switchTrackOnOpacity"),forceActiveCheckbox:u("forceActive"),backgroundTypeSelect:u("backgroundType"),bgBrightnessSlider:u("bgBrightness"),specularOpacitySlider:u("specularOpacity"),specularAngleSlider:u("specularAngle"),specularSaturationSlider:u("specularSaturation"),specularTypeSelect:u("specularType"),blurTypeSelect:u("blurType"),blurAmountSlider:u("blurAmount"),progressiveBlurSlider:u("progressiveBlur"),progressiveBlurTypeSelect:u("progressiveBlurType"),glassThemeSelect:u("glassTheme"),glassBgColorInput:u("glassBgColor"),glassCustomColorControls:document.querySelectorAll(".glass-custom-color-control"),glassBgOpacitySlider:u("glassBgOpacity"),pressedGlassBgOpacitySlider:u("pressedGlassBgOpacity"),liquidEnabledCheckbox:u("liquidEnabled"),liquidPressScaleSlider:u("liquidPressScale"),liquidPressRefractionSlider:u("liquidPressRefraction"),liquidSpeedSlider:u("liquidSpeed"),liquidClickSquashSlider:u("liquidClickSquash"),liquidDragSquashSlider:u("liquidDragSquash"),liquidReleaseSquashSlider:u("liquidReleaseSquash"),shadowOpacitySlider:u("shadowOpacity"),shadowBlurSlider:u("shadowBlur"),shadowOffsetXSlider:u("shadowOffsetX"),shadowOffsetYSlider:u("shadowOffsetY"),surfaceButtons:document.querySelectorAll(".surface-btn"),circleOnlyControls:document.querySelectorAll(".circle-only-control"),iconOnlyControls:document.querySelectorAll(".icon-only-control"),rectOnlyControls:document.querySelectorAll(".rect-only-control"),switchOnlyControls:document.querySelectorAll(".switch-only-control"),gridOnlyControls:document.querySelectorAll(".grid-only-control"),articleBackground:u("articleBackground")}}function g(i,e){i.value=String(e)}function ue(i){document.querySelectorAll(".section-header").forEach(e=>{e.addEventListener("click",()=>{const t=e.closest(".panel-section");if(!t)return;const s=t.classList.toggle("collapsed");e.setAttribute("aria-expanded",String(!s)),!s&&t.classList.contains("displacement-section")&&i()})})}class B{get isSwitchMode(){return this.id==="switch"}get isSliderMode(){return this.id==="slider"}get isTrackPreset(){return this.isSwitchMode||this.isSliderMode}get supportsIcon(){return!1}}class he extends B{constructor(){super(...arguments);d(this,"id","circle-lens");d(this,"config",{shapeType:0,surfaceType:"convex-circle",bezelWidth:60,glassThickness:50,refractiveIndex:1.5,magnifyingScale:0,circleSize:1,rectWidth:420,rectHeight:96,rectRadiusPercent:100,switchTrackWidth:184,switchTrackHeight:67,switchTrackOffOpacity:.34,switchTrackOnOpacity:.86,maxDisplacementScale:.8,trackProgress:1,scaleRatio:1,blurAmount:0,blurType:1,progressiveBlur:0,progressiveBlurType:0,glassBgOpacity:0,pressedGlassBgOpacity:0,specularType:0,specularOpacity:.4,specularAngle:60,specularSaturation:4,shadowOpacity:.1,shadowBlur:30,shadowOffsetX:0,shadowOffsetY:15,liquidPressScale:1.16,liquidPressRefraction:1.28,liquidClickSquash:1,liquidDragSquash:1,liquidReleaseSquash:1,liquidSpeed:1})}get supportsIcon(){return!0}}class pe extends B{constructor(){super(...arguments);d(this,"id","rectangle");d(this,"config",{shapeType:1,surfaceType:"convex-squircle",bezelWidth:60,glassThickness:50,refractiveIndex:1.5,magnifyingScale:0,circleSize:1,rectWidth:420,rectHeight:96,rectRadiusPercent:100,switchTrackWidth:184,switchTrackHeight:67,switchTrackOffOpacity:.34,switchTrackOnOpacity:.86,maxDisplacementScale:4,trackProgress:1,scaleRatio:1,blurAmount:0,blurType:1,progressiveBlur:0,progressiveBlurType:0,glassBgOpacity:.08,pressedGlassBgOpacity:0,specularType:0,specularOpacity:.4,specularAngle:60,specularSaturation:4,shadowOpacity:.12,shadowBlur:26,shadowOffsetX:0,shadowOffsetY:12,liquidPressScale:1.16,liquidPressRefraction:1.28,liquidClickSquash:1,liquidDragSquash:1,liquidReleaseSquash:1,liquidSpeed:1})}}class ge extends B{constructor(){super(...arguments);d(this,"id","panel");d(this,"config",{shapeType:1,surfaceType:"convex-squircle",bezelWidth:29,glassThickness:90,refractiveIndex:1.3,magnifyingScale:0,circleSize:1,rectWidth:640,rectHeight:63,rectRadiusPercent:100,switchTrackWidth:184,switchTrackHeight:67,switchTrackOffOpacity:.34,switchTrackOnOpacity:.86,maxDisplacementScale:4,trackProgress:1,scaleRatio:1,blurAmount:0,blurType:0,progressiveBlur:0,progressiveBlurType:0,glassBgOpacity:.96,pressedGlassBgOpacity:0,specularType:0,specularOpacity:.35,specularAngle:60,specularSaturation:4,shadowOpacity:.1,shadowBlur:24,shadowOffsetX:0,shadowOffsetY:8,liquidPressScale:1.08,liquidPressRefraction:1.35,liquidClickSquash:1,liquidDragSquash:1,liquidReleaseSquash:1,liquidSpeed:1})}}class fe extends B{constructor(){super(...arguments);d(this,"id","slider");d(this,"config",{shapeType:1,surfaceType:"convex-squircle",bezelWidth:16,glassThickness:80,refractiveIndex:1.45,magnifyingScale:0,circleSize:.6,rectWidth:90,rectHeight:60,rectRadiusPercent:100,switchTrackWidth:330,switchTrackHeight:14,switchTrackOffOpacity:.4,switchTrackOnOpacity:.95,maxDisplacementScale:4,trackProgress:.1,scaleRatio:1,blurAmount:0,blurType:0,progressiveBlur:0,progressiveBlurType:0,glassBgOpacity:.92,pressedGlassBgOpacity:0,specularType:0,specularOpacity:.4,specularAngle:60,specularSaturation:7,shadowOpacity:.1,shadowBlur:20,shadowOffsetX:0,shadowOffsetY:4,liquidPressScale:1.67,liquidPressRefraction:2.25,liquidClickSquash:.9,liquidDragSquash:1,liquidReleaseSquash:.9,liquidSpeed:1.1})}}class me extends B{constructor(){super(...arguments);d(this,"id","switch");d(this,"config",{shapeType:1,surfaceType:"lip",bezelWidth:19,glassThickness:47,refractiveIndex:1.5,magnifyingScale:0,circleSize:.65,rectWidth:146,rectHeight:92,rectRadiusPercent:100,switchTrackWidth:160,switchTrackHeight:67,switchTrackOffOpacity:.9,switchTrackOnOpacity:1,maxDisplacementScale:4,trackProgress:1,scaleRatio:.4,blurAmount:.2,blurType:0,progressiveBlur:0,progressiveBlurType:0,glassBgOpacity:1,pressedGlassBgOpacity:0,specularType:0,specularOpacity:.5,specularAngle:60,specularSaturation:6,shadowOpacity:.1,shadowBlur:22,shadowOffsetX:0,shadowOffsetY:4,liquidPressScale:1.38,liquidPressRefraction:2.25,liquidClickSquash:.85,liquidDragSquash:1.1,liquidReleaseSquash:.9,liquidSpeed:1.2})}}class _e extends B{constructor(){super(...arguments);d(this,"id","split-menu");d(this,"config",{shapeType:0,surfaceType:"convex-squircle",bezelWidth:60,glassThickness:50,refractiveIndex:1.5,magnifyingScale:0,circleSize:.35,rectWidth:260,rectHeight:140,rectRadiusPercent:100,switchTrackWidth:184,switchTrackHeight:67,switchTrackOffOpacity:.34,switchTrackOnOpacity:.86,maxDisplacementScale:.8,trackProgress:1,scaleRatio:1,blurAmount:0,blurType:1,progressiveBlur:0,progressiveBlurType:0,glassBgOpacity:.1,pressedGlassBgOpacity:.2,specularType:1,specularOpacity:.4,specularAngle:60,specularSaturation:4,shadowOpacity:.1,shadowBlur:30,shadowOffsetX:0,shadowOffsetY:15,liquidPressScale:1.1,liquidPressRefraction:1.2,liquidClickSquash:1,liquidDragSquash:1,liquidReleaseSquash:1,liquidSpeed:1})}}const ye={"circle-lens":new he,rectangle:new pe,switch:new me,slider:new fe,panel:new ge,"split-menu":new _e};function F(i){return ye[i]}function v(i,e,t){return{value:i,velocity:0,target:i,stiffness:e,damping:t}}function ve(i){return{scale:v(i.glassParams.circleSize,360,18),refraction:v(i.glassParams.scaleRatio,420,18),magnification:v(i.glassParams.magnifyingScale,360,22),deformationX:v(1,300,15),deformationY:v(1,300,15),shadowOpacity:v(i.glassParams.shadowOpacity,360,24),shadowBlur:v(i.glassParams.shadowBlur,360,24),shadowOffsetY:v(i.glassParams.shadowOffsetY,360,24),specularOpacity:v(i.glassParams.specularOpacity,420,20),glassBgOpacity:v(i.glassParams.glassBgOpacity,800,50),liquid:v(0,300,13),splitMenuProgress:v(0,240,20)}}function S(i,e){i.value=e,i.target=e,i.velocity=0}function Se(i,e){S(i.scale,e.circleSize),S(i.refraction,e.scaleRatio),S(i.magnification,e.magnifyingScale),S(i.shadowOpacity,e.shadowOpacity),S(i.shadowBlur,e.shadowBlur),S(i.shadowOffsetY,e.shadowOffsetY),S(i.specularOpacity,e.specularOpacity),S(i.glassBgOpacity,e.glassBgOpacity),S(i.liquid,0),S(i.splitMenuProgress,0)}function we(i){S(i.deformationX,1),S(i.deformationY,1)}function xe(i,e,t){for(const s in i){const r=i[s];let a=e;for(;a>0;){const n=Math.min(a,.008333333333333333),c=(r.target-r.value)*r.stiffness*t*t-r.velocity*r.damping*t;r.velocity+=c*n,r.value+=r.velocity*n,a-=n}}}const X={"convex-circle":0,"convex-squircle":1,concave:2,lip:3};class be{constructor(e){this.options=e}setup(){this.updateShapeControls(),this.updateIconControls(),this.updateBackgroundControls(),this.updateGlassTheme(),this.updateSpecularControls(),this.bindEvents()}setCircleSize(e){const{controls:t,userParams:s}=this.options,r=Math.min(Math.max(e,parseFloat(t.circleSizeSlider.min)),parseFloat(t.circleSizeSlider.max));s.circleSize=r,t.circleSizeSlider.value=r.toFixed(2)}setRectWidth(e){const{controls:t,renderer:s}=this.options,r=Math.min(Math.max(e,parseFloat(t.rectWidthSlider.min)),parseFloat(t.rectWidthSlider.max));s.glassParams.rectWidth=r,t.rectWidthSlider.value=String(r)}setRectHeight(e){const{controls:t,renderer:s}=this.options,r=Math.min(Math.max(e,parseFloat(t.rectHeightSlider.min)),parseFloat(t.rectHeightSlider.max));s.glassParams.rectHeight=r,t.rectHeightSlider.value=String(r)}applyPreset(e){const t=F(e),s=t.config,{controls:r,renderer:a,setCurrentPreset:n,setCurrentSurfaceType:c,springs:l,updateDisplacementMap:p,userParams:o}=this.options;n(e),a.glassParams.shapeType=s.shapeType,a.setSwitchMode(t.isSwitchMode),a.setSliderMode(t.isSliderMode),e==="panel"&&a.centerGlass(),c(s.surfaceType),a.glassParams.surfaceType=X[s.surfaceType],a.glassParams.bezelWidth=s.bezelWidth,a.glassParams.glassThickness=s.glassThickness,a.glassParams.refractiveIndex=s.refractiveIndex,a.glassParams.magnifyingScale=s.magnifyingScale,a.glassParams.circleSize=s.circleSize,a.glassParams.rectWidth=s.rectWidth,a.glassParams.rectHeight=s.rectHeight,a.glassParams.rectRadiusPercent=s.rectRadiusPercent,a.glassParams.switchTrackWidth=s.switchTrackWidth,a.glassParams.switchTrackHeight=s.switchTrackHeight,a.glassParams.switchTrackOffOpacity=s.switchTrackOffOpacity,a.glassParams.switchTrackOnOpacity=s.switchTrackOnOpacity,a.glassParams.maxDisplacementScale=s.maxDisplacementScale,a.setSwitchProgress(s.trackProgress),a.glassParams.scaleRatio=s.scaleRatio,a.glassParams.blurAmount=s.blurAmount,a.glassParams.blurType=s.blurType,a.glassParams.progressiveBlur=s.progressiveBlur,a.glassParams.progressiveBlurType=s.progressiveBlurType,a.glassParams.glassBgOpacity=s.glassBgOpacity,a.glassParams.specularType=s.specularType,a.glassParams.specularOpacity=s.specularOpacity,a.glassParams.specularAngle=s.specularAngle*Math.PI/180,a.glassParams.specularSaturation=s.specularSaturation,a.glassParams.shadowOpacity=s.shadowOpacity,a.glassParams.shadowBlur=s.shadowBlur,a.glassParams.shadowOffsetX=s.shadowOffsetX,a.glassParams.shadowOffsetY=s.shadowOffsetY,o.splitMenuOpen=!1,o.splitMenuProgress=0,Pe(o,s),Se(l,s),r.surfaceButtons.forEach(h=>{h.classList.toggle("active",h.getAttribute("data-surface")===s.surfaceType)}),g(r.bezelSlider,s.bezelWidth),g(r.thicknessSlider,s.glassThickness),g(r.refractiveIndexSlider,s.refractiveIndex),g(r.magnifyingScaleSlider,s.magnifyingScale),g(r.circleSizeSlider,s.circleSize),g(r.rectWidthSlider,s.rectWidth),g(r.rectHeightSlider,s.rectHeight),g(r.rectRadiusSlider,s.rectRadiusPercent),g(r.switchTrackWidthSlider,s.switchTrackWidth),g(r.switchTrackHeightSlider,s.switchTrackHeight),g(r.switchTrackOffOpacitySlider,s.switchTrackOffOpacity),g(r.switchTrackOnOpacitySlider,s.switchTrackOnOpacity),g(r.scaleSlider,s.scaleRatio),r.specularTypeSelect.value=String(s.specularType),r.blurTypeSelect.value=String(s.blurType),g(r.blurAmountSlider,s.blurAmount),g(r.progressiveBlurSlider,s.progressiveBlur),r.progressiveBlurTypeSelect.value=String(s.progressiveBlurType),g(r.glassBgOpacitySlider,s.glassBgOpacity),g(r.pressedGlassBgOpacitySlider,s.pressedGlassBgOpacity),g(r.liquidPressScaleSlider,s.liquidPressScale),g(r.liquidPressRefractionSlider,s.liquidPressRefraction),g(r.liquidClickSquashSlider,s.liquidClickSquash),g(r.liquidDragSquashSlider,s.liquidDragSquash),g(r.liquidReleaseSquashSlider,s.liquidReleaseSquash),g(r.liquidSpeedSlider,s.liquidSpeed),g(r.specularOpacitySlider,s.specularOpacity),g(r.specularAngleSlider,s.specularAngle),g(r.specularSaturationSlider,s.specularSaturation),g(r.shadowOpacitySlider,s.shadowOpacity),g(r.shadowBlurSlider,s.shadowBlur),g(r.shadowOffsetXSlider,s.shadowOffsetX),g(r.shadowOffsetYSlider,s.shadowOffsetY),t.supportsIcon||(a.glassParams.iconType=0,a.setIcon(null).catch(console.error),r.iconTypeSelect.value="none"),this.updateShapeControls(),this.updateIconControls(),p()}bindEvents(){const{controls:e,renderer:t,setCurrentSurfaceType:s,updateDisplacementMap:r,userParams:a,springs:n}=this.options;window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{e.glassThemeSelect.value==="system"&&this.updateGlassTheme()}),e.presetSelect.addEventListener("change",()=>{this.applyPreset(e.presetSelect.value)}),e.surfaceButtons.forEach(l=>{l.addEventListener("click",()=>{e.surfaceButtons.forEach(o=>o.classList.remove("active")),l.classList.add("active");const p=l.getAttribute("data-surface");s(p),t.glassParams.surfaceType=X[p],r()})}),e.bezelSlider.addEventListener("input",()=>{t.glassParams.bezelWidth=parseInt(e.bezelSlider.value),r()}),e.thicknessSlider.addEventListener("input",()=>{t.glassParams.glassThickness=parseInt(e.thicknessSlider.value),r()}),e.refractiveIndexSlider.addEventListener("input",()=>{t.glassParams.refractiveIndex=parseFloat(e.refractiveIndexSlider.value),r()}),e.scaleSlider.addEventListener("input",()=>{a.scaleRatio=parseFloat(e.scaleSlider.value),r()}),e.magnifyingScaleSlider.addEventListener("input",()=>{a.magnifyingScale=parseFloat(e.magnifyingScaleSlider.value)}),e.circleSizeSlider.addEventListener("input",()=>{this.setCircleSize(parseFloat(e.circleSizeSlider.value))}),e.rectWidthSlider.addEventListener("input",()=>{this.setRectWidth(parseFloat(e.rectWidthSlider.value))}),e.rectHeightSlider.addEventListener("input",()=>{this.setRectHeight(parseFloat(e.rectHeightSlider.value))}),e.rectRadiusSlider.addEventListener("input",()=>{t.glassParams.rectRadiusPercent=parseFloat(e.rectRadiusSlider.value)}),e.iconTypeSelect.addEventListener("change",()=>{const l=e.iconTypeSelect.value;l==="none"?(t.glassParams.iconType=0,t.setIcon(null).catch(console.error)):(t.glassParams.iconType=1,t.setIcon(`/glass-effect-webgpu/assets/icons/${l}.svg`).catch(console.error)),this.updateIconControls()}),e.iconOpacitySlider.addEventListener("input",()=>{t.glassParams.iconOpacity=parseFloat(e.iconOpacitySlider.value)}),e.iconScaleSlider.addEventListener("input",()=>{t.glassParams.iconScale=parseFloat(e.iconScaleSlider.value)}),e.iconColorInput.addEventListener("input",()=>{const l=e.iconColorInput.value;t.glassParams.iconColorR=parseInt(l.slice(1,3),16)/255,t.glassParams.iconColorG=parseInt(l.slice(3,5),16)/255,t.glassParams.iconColorB=parseInt(l.slice(5,7),16)/255}),e.switchTrackWidthSlider.addEventListener("input",()=>{t.glassParams.switchTrackWidth=parseFloat(e.switchTrackWidthSlider.value),this.syncTrackProgress()}),e.switchTrackHeightSlider.addEventListener("input",()=>{t.glassParams.switchTrackHeight=parseFloat(e.switchTrackHeightSlider.value),this.syncTrackProgress()}),e.switchTrackOffOpacitySlider.addEventListener("input",()=>{t.glassParams.switchTrackOffOpacity=parseFloat(e.switchTrackOffOpacitySlider.value)}),e.switchTrackOnOpacitySlider.addEventListener("input",()=>{t.glassParams.switchTrackOnOpacity=parseFloat(e.switchTrackOnOpacitySlider.value)}),e.forceActiveCheckbox.addEventListener("change",()=>{a.forceActive=e.forceActiveCheckbox.checked}),e.backgroundTypeSelect.addEventListener("change",()=>{t.setBackground(e.backgroundTypeSelect.value).catch(console.error),this.updateBackgroundControls()}),e.gridCellSizeSlider.addEventListener("input",()=>{t.glassParams.gridCellSize=parseFloat(e.gridCellSizeSlider.value)}),e.gridSpeedSlider.addEventListener("input",()=>{t.setGridSpeed(parseFloat(e.gridSpeedSlider.value))}),e.bgBrightnessSlider.addEventListener("input",()=>{t.glassParams.bgBrightness=parseFloat(e.bgBrightnessSlider.value)}),e.specularOpacitySlider.addEventListener("input",()=>{a.specularOpacity=parseFloat(e.specularOpacitySlider.value)}),e.specularAngleSlider.addEventListener("input",()=>{t.glassParams.specularAngle=parseFloat(e.specularAngleSlider.value)*Math.PI/180}),e.specularSaturationSlider.addEventListener("input",()=>{t.glassParams.specularSaturation=parseFloat(e.specularSaturationSlider.value)}),e.specularTypeSelect.addEventListener("change",()=>{t.glassParams.specularType=parseFloat(e.specularTypeSelect.value),this.updateSpecularControls()}),e.blurTypeSelect.addEventListener("change",()=>{t.glassParams.blurType=parseFloat(e.blurTypeSelect.value)}),e.blurAmountSlider.addEventListener("input",()=>{t.glassParams.blurAmount=parseFloat(e.blurAmountSlider.value)}),e.progressiveBlurSlider.addEventListener("input",()=>{t.glassParams.progressiveBlur=parseFloat(e.progressiveBlurSlider.value)}),e.progressiveBlurTypeSelect.addEventListener("change",()=>{t.glassParams.progressiveBlurType=parseFloat(e.progressiveBlurTypeSelect.value)}),e.glassThemeSelect.addEventListener("change",()=>this.updateGlassTheme()),e.glassBgColorInput.addEventListener("input",()=>{const l=e.glassBgColorInput.value;t.glassParams.glassTintR=parseInt(l.slice(1,3),16)/255,t.glassParams.glassTintG=parseInt(l.slice(3,5),16)/255,t.glassParams.glassTintB=parseInt(l.slice(5,7),16)/255}),e.glassBgOpacitySlider.addEventListener("input",()=>{a.glassBgOpacity=parseFloat(e.glassBgOpacitySlider.value)}),e.pressedGlassBgOpacitySlider.addEventListener("input",()=>{a.pressedGlassBgOpacity=parseFloat(e.pressedGlassBgOpacitySlider.value)}),e.liquidEnabledCheckbox.addEventListener("change",()=>{a.liquidEnabled=e.liquidEnabledCheckbox.checked,a.liquidEnabled||(n.liquid.value=0,n.liquid.target=0,n.liquid.velocity=0,we(n))}),e.liquidPressScaleSlider.addEventListener("input",()=>{a.liquidPressScale=parseFloat(e.liquidPressScaleSlider.value)}),e.liquidPressRefractionSlider.addEventListener("input",()=>{a.liquidPressRefraction=parseFloat(e.liquidPressRefractionSlider.value)}),e.liquidSpeedSlider.addEventListener("input",()=>{a.liquidSpeed=parseFloat(e.liquidSpeedSlider.value)}),e.liquidClickSquashSlider.addEventListener("input",()=>{a.liquidClickSquash=parseFloat(e.liquidClickSquashSlider.value)}),e.liquidDragSquashSlider.addEventListener("input",()=>{a.liquidDragSquash=parseFloat(e.liquidDragSquashSlider.value)}),e.liquidReleaseSquashSlider.addEventListener("input",()=>{a.liquidReleaseSquash=parseFloat(e.liquidReleaseSquashSlider.value)}),e.shadowOpacitySlider.addEventListener("input",()=>{a.shadowOpacity=parseFloat(e.shadowOpacitySlider.value)}),e.shadowBlurSlider.addEventListener("input",()=>{a.shadowBlur=parseFloat(e.shadowBlurSlider.value)}),e.shadowOffsetXSlider.addEventListener("input",()=>{a.shadowOffsetX=parseFloat(e.shadowOffsetXSlider.value)}),e.shadowOffsetYSlider.addEventListener("input",()=>{a.shadowOffsetY=parseFloat(e.shadowOffsetYSlider.value)})}syncTrackProgress(){const{renderer:e,getCurrentPreset:t}=this.options,s=t();(s==="switch"||s==="slider")&&e.setSwitchProgress(e.getSwitchProgress())}updateShapeControls(){const{controls:e,renderer:t,getCurrentPreset:s}=this.options,r=t.glassParams.shapeType===1,a=s(),n=a==="switch"||a==="slider";e.circleOnlyControls.forEach(c=>c.classList.toggle("hidden",r)),e.rectOnlyControls.forEach(c=>c.classList.toggle("hidden",!r)),e.switchOnlyControls.forEach(c=>c.classList.toggle("hidden",!n))}updateIconControls(){const{controls:e,renderer:t,getCurrentPreset:s}=this.options,a=F(s()).supportsIcon,n=t.glassParams.iconType>0,c=e.iconTypeSelect.closest(".control-row");c==null||c.classList.toggle("hidden",!a),e.iconOnlyControls.forEach(l=>l.classList.toggle("hidden",!n||!a))}updateBackgroundControls(){const{controls:e}=this.options,t=e.backgroundTypeSelect.value,s=t==="grid",r=t==="article";e.gridOnlyControls.forEach(a=>a.classList.toggle("hidden",!s)),e.articleBackground.classList.toggle("hidden",!r)}resolveGlassTheme(){const e=this.options.controls.glassThemeSelect.value;return e==="light"||e==="dark"||e==="custom"?e:window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}updateGlassTheme(){const{controls:e,renderer:t}=this.options,s=this.resolveGlassTheme(),r=s==="custom";if(e.glassCustomColorControls.forEach(a=>a.classList.toggle("hidden",!r)),r){const a=e.glassBgColorInput.value;t.glassParams.glassTintR=parseInt(a.slice(1,3),16)/255,t.glassParams.glassTintG=parseInt(a.slice(3,5),16)/255,t.glassParams.glassTintB=parseInt(a.slice(5,7),16)/255}else{const a=.13333333333333333;t.glassParams.glassTintR=s==="dark"?a:1,t.glassParams.glassTintG=s==="dark"?a:1,t.glassParams.glassTintB=s==="dark"?a:1}}updateSpecularControls(){const{controls:e,renderer:t}=this.options,s=t.glassParams.specularType===1,r=e.specularSaturationSlider.closest(".control-row");r==null||r.classList.toggle("hidden",s)}}function Pe(i,e){i.circleSize=e.circleSize,i.scaleRatio=e.scaleRatio,i.magnifyingScale=e.magnifyingScale,i.shadowOpacity=e.shadowOpacity,i.shadowBlur=e.shadowBlur,i.shadowOffsetX=e.shadowOffsetX,i.shadowOffsetY=e.shadowOffsetY,i.specularOpacity=e.specularOpacity,i.glassBgOpacity=e.glassBgOpacity,i.pressedGlassBgOpacity=e.pressedGlassBgOpacity,i.liquidPressScale=e.liquidPressScale,i.liquidPressRefraction=e.liquidPressRefraction,i.liquidClickSquash=e.liquidClickSquash,i.liquidDragSquash=e.liquidDragSquash,i.liquidReleaseSquash=e.liquidReleaseSquash,i.liquidSpeed=e.liquidSpeed}const Te={"convex-circle":i=>Math.sqrt(1-(1-i)**2),"convex-squircle":i=>Math.pow(1-Math.pow(1-i,4),1/4),concave:i=>1-Math.sqrt(1-(1-i)**2),lip:i=>{const e=Math.pow(1-Math.pow(1-i*2,4),.25),t=1-Math.sqrt(1-(1-i)**2)+.1,s=6*i**5-15*i**4+10*i**3;return e*(1-s)+t*s}};function Oe(i,e,t,s,r=128){const a=1/s,n=Te[t];function c(l,p){const o=p,h=1-a*a*(1-o*o);if(h<0)return null;const m=Math.sqrt(h);return[-(a*o+m)*l,a-(a*o+m)*p]}return Array.from({length:r},(l,p)=>{const o=p/r,h=n(o),m=o<1?1e-4:-1e-4,w=(n(o+m)-h)/m,P=Math.sqrt(w*w+1),x=[-w/P,-1/P],f=c(x[0],x[1]);if(f){const b=h*e+i;return f[0]*(b/f[1])}else return 0})}function ke(i,e,t,s=1){const r=i.getContext("2d");if(!r)return;const a=window.devicePixelRatio||1,n=i.clientWidth;i.width=n*a,i.height=n*a;const c=r.createImageData(i.width,i.height),l=c.data,p=Math.max(...e.map(Math.abs),1),o=n*a/2-20*a,h=i.width/2,m=i.height/2,y=t/110*o,w=90,P=106,x=80;for(let f=0;f<l.length;f+=4)l[f]=w,l[f+1]=P,l[f+2]=x,l[f+3]=255;for(let f=0;f<i.height;f++)for(let _=0;_<i.width;_++){const b=_-h,T=f-m,O=Math.sqrt(b*b+T*T),q=o-O;if(q<0||q>y)continue;const k=q/y,Y=Math.min(e.length-1,Math.floor(k*e.length)),I=(e[Y]||0)/p*s,A=O>.001?b/O:0,D=O>.001?T/O:0,H=-A*I,U=-D*I,V=Math.round(128+H*127),N=Math.round(128+U*127),M=(f*i.width+_)*4;l[M]=V,l[M+1]=N,l[M+2]=0,l[M+3]=255}for(let f=0;f<i.height;f++)for(let _=0;_<i.width;_++){const b=_-h,T=f-m,O=Math.sqrt(b*b+T*T);if(o-O>y){const k=(f*i.width+_)*4;l[k]=128,l[k+1]=128,l[k+2]=0,l[k+3]=255}}r.putImageData(c,0,0)}class qe{constructor(e,t,s){d(this,"surfaceType","convex-circle");this.canvas=e,this.renderer=t,this.getScaleRatio=s}setSurfaceType(e){this.surfaceType=e}render(){const e=Oe(this.renderer.glassParams.glassThickness,this.renderer.glassParams.bezelWidth,this.surfaceType,this.renderer.glassParams.refractiveIndex,128);ke(this.canvas,e,this.renderer.glassParams.bezelWidth,this.getScaleRatio())}}class Ce{constructor(e){d(this,"draggingGlass",!1);d(this,"currentVelocity",{x:0,y:0});d(this,"glassDragOffset",{x:0,y:0});d(this,"lastPointerPos",{x:0,y:0});d(this,"pointerStartPos",{x:0,y:0});d(this,"lastPointerTime",0);d(this,"onPointerDown",e=>{const{canvas:t,renderer:s,springs:r,userParams:a}=this.options;if(this.isTrackPreset()){if(!s.isPointInsideSwitchTrack(e.clientX,e.clientY))return}else if(!s.isPointInsideGlass(e.clientX,e.clientY))return;this.draggingGlass=!0,this.glassDragOffset=s.getGlassDragOffset(e.clientX,e.clientY),this.lastPointerPos={x:e.clientX,y:e.clientY},this.pointerStartPos={x:e.clientX,y:e.clientY},this.lastPointerTime=performance.now(),this.currentVelocity={x:0,y:0},a.liquidEnabled&&(r.liquid.value=Math.max(r.liquid.value,.72*a.liquidClickSquash),r.liquid.velocity+=2.6*a.liquidClickSquash),this.options.getCurrentPreset()==="slider"&&s.setSwitchProgressFromClientX(e.clientX),t.style.cursor="grabbing",t.setPointerCapture(e.pointerId),e.preventDefault()});d(this,"onPointerMove",e=>{const{renderer:t}=this.options;if(!this.draggingGlass){this.updateCanvasCursor(e);return}const s=performance.now(),r=Math.max((s-this.lastPointerTime)/1e3,1/120);this.currentVelocity.x=(e.clientX-this.lastPointerPos.x)/r,this.currentVelocity.y=(e.clientY-this.lastPointerPos.y)/r,this.lastPointerPos={x:e.clientX,y:e.clientY},this.lastPointerTime=s,this.isTrackPreset()?t.setSwitchProgressFromClientX(e.clientX):t.setGlassCenterFromClientPoint(e.clientX,e.clientY,this.glassDragOffset),e.preventDefault()});d(this,"onPointerUp",e=>{const{canvas:t,renderer:s,springs:r,userParams:a}=this.options;if(!this.draggingGlass){this.updateCanvasCursor(e);return}this.draggingGlass=!1,this.currentVelocity={x:0,y:0};const n=Math.hypot(e.clientX-this.pointerStartPos.x,e.clientY-this.pointerStartPos.y),c=this.options.getCurrentPreset();c==="switch"&&n<4?s.setSwitchProgress(s.getSwitchProgress()>.5?0:1):c==="split-menu"&&n<4&&(a.splitMenuOpen=!a.splitMenuOpen,r.splitMenuProgress.target=a.splitMenuOpen?1:0),a.liquidEnabled&&(r.liquid.value=Math.max(r.liquid.value,.58*a.liquidReleaseSquash),r.liquid.velocity-=3*a.liquidReleaseSquash),t.hasPointerCapture(e.pointerId)&&t.releasePointerCapture(e.pointerId),this.updateCanvasCursor(e)});d(this,"onPointerCancel",e=>{const{canvas:t}=this.options;this.draggingGlass&&(this.draggingGlass=!1,t.hasPointerCapture(e.pointerId)&&t.releasePointerCapture(e.pointerId),this.updateCanvasCursor(e))});d(this,"onPointerLeave",()=>{this.draggingGlass||(this.options.canvas.style.cursor="default")});d(this,"onWheel",e=>{const{renderer:t,setCircleSize:s,setRectWidth:r,setRectHeight:a,userParams:n,circleSizeSlider:c,rectWidthSlider:l,rectHeightSlider:p}=this.options;if(!t.isPointInsideGlass(e.clientX,e.clientY))return;const o=e.deltaY>0?-1:1;if(t.glassParams.shapeType===1){const h=o>0?1.06:.9433962264150942,m=parseFloat(l.min),y=parseFloat(l.max),w=parseFloat(p.min),P=parseFloat(p.max),x=t.glassParams.rectWidth,f=t.glassParams.rectHeight,_=o>0?Math.min(h,y/x,P/f):Math.max(h,m/x,w/f);r(x*_),a(f*_)}else{const h=o*.04,m=parseFloat(c.min),y=parseFloat(c.max);s(Math.min(Math.max(n.circleSize+h,m),y))}e.preventDefault()});this.options=e}setup(){const{canvas:e}=this.options;e.addEventListener("pointerdown",this.onPointerDown),e.addEventListener("pointermove",this.onPointerMove),e.addEventListener("pointerup",this.onPointerUp),e.addEventListener("pointercancel",this.onPointerCancel),e.addEventListener("pointerleave",this.onPointerLeave),e.addEventListener("wheel",this.onWheel,{passive:!1})}isTrackPreset(){const e=this.options.getCurrentPreset();return e==="switch"||e==="slider"}updateCanvasCursor(e){const{canvas:t,renderer:s}=this.options;if(this.draggingGlass){t.style.cursor="grabbing";return}const r=this.isTrackPreset()?s.isPointInsideSwitchTrack(e.clientX,e.clientY):s.isPointInsideGlass(e.clientX,e.clientY);t.style.cursor=r?"grab":"default"}}class Be{constructor(e){this.element=e}update(e,t){const s=t==="panel";if(this.element.classList.toggle("hidden",!s),!s)return;const r=e.getGlassCenterCssPosition(),{rectWidth:a,rectHeight:n,scaleX:c,scaleY:l}=e.glassParams;this.element.style.left=`${r.x}px`,this.element.style.top=`${r.y}px`,this.element.style.width=`${a*c}px`,this.element.style.height=`${n*l}px`}}class Me{constructor(e,t,s,r,a,n=()=>{}){d(this,"lastFrameTime",performance.now());d(this,"render",()=>{const e=performance.now(),t=Math.min((e-this.lastFrameTime)/1e3,.05);this.lastFrameTime=e,this.updateSpringTargets(t),xe(this.springs,t,this.userParams.liquidEnabled?this.userParams.liquidSpeed:1),this.applySpringValues(),this.renderer.render(),this.afterRender(),requestAnimationFrame(this.render)});this.renderer=e,this.userParams=t,this.springs=s,this.interactionState=r,this.getCurrentPreset=a,this.afterRender=n}start(){this.render()}updateSpringTargets(e){const t=this.interactionState.draggingGlass||this.userParams.forceActive,s=Math.exp(-e*(t?5.5:12));this.interactionState.currentVelocity.x*=s,this.interactionState.currentVelocity.y*=s;const r=Math.hypot(this.interactionState.currentVelocity.x,this.interactionState.currentVelocity.y),a=this.userParams.liquidEnabled?1:0,n=this.interactionState.draggingGlass?Math.min(r*18e-5*this.userParams.liquidDragSquash*a,.28*this.userParams.liquidDragSquash):0;t?(this.springs.scale.target=this.userParams.circleSize*(this.userParams.liquidEnabled?this.userParams.liquidPressScale:1),this.springs.refraction.target=this.userParams.scaleRatio*(this.userParams.liquidEnabled?this.userParams.liquidPressRefraction+n*.45:1),this.springs.magnification.target=this.userParams.magnifyingScale,this.springs.shadowOpacity.target=this.userParams.liquidEnabled?Math.min(this.userParams.shadowOpacity+.1,1):this.userParams.shadowOpacity,this.springs.shadowBlur.target=this.userParams.liquidEnabled?this.userParams.shadowBlur*.72:this.userParams.shadowBlur,this.springs.shadowOffsetY.target=this.userParams.liquidEnabled?this.userParams.shadowOffsetY+5:this.userParams.shadowOffsetY,this.springs.specularOpacity.target=this.userParams.liquidEnabled?Math.min(this.userParams.specularOpacity+.22,1):this.userParams.specularOpacity,this.springs.glassBgOpacity.target=this.userParams.pressedGlassBgOpacity,this.springs.liquid.target=0):(this.springs.scale.target=this.userParams.circleSize,this.springs.refraction.target=this.userParams.scaleRatio,this.springs.magnification.target=this.userParams.magnifyingScale,this.springs.shadowOpacity.target=this.userParams.shadowOpacity,this.springs.shadowBlur.target=this.userParams.shadowBlur,this.springs.shadowOffsetY.target=this.userParams.shadowOffsetY,this.springs.specularOpacity.target=this.userParams.specularOpacity,this.springs.glassBgOpacity.target=this.userParams.glassBgOpacity,this.springs.liquid.target=0);const c=Math.min(Math.abs(this.interactionState.currentVelocity.x)*16e-5*this.userParams.liquidDragSquash*a,.24*this.userParams.liquidDragSquash),l=Math.min(Math.abs(this.interactionState.currentVelocity.y)*16e-5*this.userParams.liquidDragSquash*a,.24*this.userParams.liquidDragSquash);this.springs.deformationX.target=1+this.springs.liquid.value*.12*a+c-l*.45,this.springs.deformationY.target=1-this.springs.liquid.value*.08*a+l-c*.45}applySpringValues(){const e=this.springs.scale.value,t=this.renderer.glassParams.shapeType===1,s=this.getCurrentPreset();this.renderer.glassParams.circleSize=t?this.userParams.circleSize:this.springs.scale.value,this.renderer.glassParams.scaleRatio=this.springs.refraction.value,this.renderer.glassParams.magnifyingScale=this.springs.magnification.value,this.renderer.glassParams.scaleX=this.springs.deformationX.value*(t?e:1),this.renderer.glassParams.scaleY=this.springs.deformationY.value*(t?e:1),this.renderer.glassParams.shadowOpacity=this.springs.shadowOpacity.value,this.renderer.glassParams.shadowBlur=this.springs.shadowBlur.value,this.renderer.glassParams.shadowOffsetX=this.userParams.shadowOffsetX,this.renderer.glassParams.shadowOffsetY=this.springs.shadowOffsetY.value,this.renderer.glassParams.specularOpacity=this.springs.specularOpacity.value,this.renderer.glassParams.glassBgOpacity=this.springs.glassBgOpacity.value,this.renderer.glassParams.splitMenuProgress=this.springs.splitMenuProgress.value,this.renderer.glassParams.liquidEnabled=this.userParams.liquidEnabled,this.renderer.glassParams.splitMenuMode=s==="split-menu"}}class Re{constructor(e,t){d(this,"renderer");d(this,"currentPreset","circle-lens");d(this,"currentSurfaceType","convex-circle");this.mainCanvas=e,this.displacementCanvas=t}async start(){this.renderer=new oe(this.mainCanvas),await this.renderer.init();const e=de(),t=new Be(e.panelControls),s=this.createInitialUserParams(),r=ve(this.renderer),a=new qe(this.displacementCanvas,this.renderer,()=>s.scaleRatio),n=()=>{a.setSurfaceType(this.currentSurfaceType),a.render()},c=new be({controls:e,renderer:this.renderer,userParams:s,springs:r,setCurrentPreset:o=>{this.currentPreset=o},getCurrentPreset:()=>this.currentPreset,setCurrentSurfaceType:o=>{this.currentSurfaceType=o},updateDisplacementMap:n}),l=new Ce({canvas:this.mainCanvas,renderer:this.renderer,userParams:s,springs:r,getCurrentPreset:()=>this.currentPreset,setCircleSize:o=>c.setCircleSize(o),setRectWidth:o=>c.setRectWidth(o),setRectHeight:o=>c.setRectHeight(o),circleSizeSlider:e.circleSizeSlider,rectWidthSlider:e.rectWidthSlider,rectHeightSlider:e.rectHeightSlider});ue(n),c.setup(),l.setup(),n(),new ResizeObserver(n).observe(this.displacementCanvas),new Me(this.renderer,s,r,l,()=>this.currentPreset,()=>t.update(this.renderer,this.currentPreset)).start()}createInitialUserParams(){return{circleSize:this.renderer.glassParams.circleSize,scaleRatio:this.renderer.glassParams.scaleRatio,magnifyingScale:this.renderer.glassParams.magnifyingScale,shadowOpacity:this.renderer.glassParams.shadowOpacity,shadowBlur:this.renderer.glassParams.shadowBlur,shadowOffsetX:this.renderer.glassParams.shadowOffsetX,shadowOffsetY:this.renderer.glassParams.shadowOffsetY,specularOpacity:this.renderer.glassParams.specularOpacity,glassBgOpacity:this.renderer.glassParams.glassBgOpacity,pressedGlassBgOpacity:0,forceActive:!1,liquidEnabled:!0,splitMenuOpen:!1,splitMenuProgress:0,liquidPressScale:1.16,liquidPressRefraction:1.28,liquidSpeed:1,liquidClickSquash:1,liquidDragSquash:1,liquidReleaseSquash:1}}}async function ze(){const i=document.getElementById("mainCanvas"),e=document.getElementById("displacementMap");if(!i||!e)throw new Error("Canvas elements not found");const t=document.getElementById("articleImage");t&&(t.src="/glass-effect-webgpu/assets/frog.jpg"),await new Re(i,e).start()}ze().catch(console.error);
