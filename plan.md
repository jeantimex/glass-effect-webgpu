# Glass Effect WebGPU Port - Implementation Plan

## Overview

Port the "Liquid Glass" effect from CSS+SVG filters to WebGPU. The original implementation uses SVG `feDisplacementMap` filters to simulate light refraction through glass. WebGPU allows us to implement the same physics-based refraction directly in shaders, with better performance and more flexibility.

## Reference Implementation Analysis

### Core Concepts from kube.io

1. **Snell's Law Refraction**: `n1 * sin(θ1) = n2 * sin(θ2)`
   - Air has refractive index ~1.0
   - Glass has refractive index ~1.5
   - Light bends toward normal when entering denser medium

2. **Surface Functions** (from `surfaceEquations.ts`):
   - `Convex Circle`: `y = sqrt(1 - (1-x)²)` — spherical dome
   - `Convex Squircle`: `y = (1 - (1-x)⁴)^(1/4)` — Apple's preferred shape, smoother transition
   - `Concave`: `y = 1 - convex(x)` — bowl-like depression
   - `Lip`: blend of convex and concave — raised rim with shallow center

3. **Displacement Map Generation** (from `displacementMap.ts`):
   - Pre-compute displacement magnitudes along a single radius (127 samples)
   - For each pixel: calculate distance from border, lookup displacement, rotate by angle to center
   - Encode X displacement in Red channel, Y in Green channel
   - Value 128 = no displacement, 0 = -max, 255 = +max

4. **Specular Highlight** (from `specular.ts`):
   - Rim light effect based on surface normal vs light direction
   - Appears around edges where normal aligns with light
   - Combined with refracted image via `feBlend`

5. **SVG Filter Pipeline** (from `Filter.tsx`):
   ```
   SourceGraphic → feGaussianBlur → feDisplacementMap (refraction)
                                  → feColorMatrix (saturation)
                                  → feBlend (specular overlay)
   ```

---

## Step 1: Implement Surface Height Functions in WGSL

**Goal**: Define glass surface profiles that determine refraction behavior.

**Implementation**:
- Port the 4 surface equations to WGSL functions
- Each function takes normalized distance from edge (0-1) and returns height (0-1)
- Use uniform to select which profile is active

**Files to modify**: `src/webgpu/shader.ts`

**Expected Result**:
- Shader contains `convex_circle()`, `convex_squircle()`, `concave()`, and `lip()` functions
- A uniform controls which surface type is used
- No visual change yet (setup only)

---

## Step 2: Calculate Surface Normal from Height Function

**Goal**: Compute the surface normal at each point, needed for refraction calculation.

**Implementation**:
- Use numerical derivative: `normal.x = -dHeight/dx`, `normal.y = 1`
- Normalize the normal vector
- Only calculate within the bezel region (edge band of the glass)

**Files to modify**: `src/webgpu/shader.ts`

**Expected Result**:
- Debug visualization showing normal vectors as colors (R = normal.x, G = normal.y)
- Normals point outward from glass center along bezel
- Center of glass (past bezel) has flat normal (0, 1)

---

## Step 3: Implement Snell's Law Refraction

**Goal**: Calculate refracted ray direction based on surface normal and refractive index.

**Implementation**:
```wgsl
fn refract_ray(incident: vec2f, normal: vec2f, eta: f32) -> vec2f {
  let dot_ni = dot(normal, incident);
  let k = 1.0 - eta * eta * (1.0 - dot_ni * dot_ni);
  if (k < 0.0) { return vec2f(0.0); } // Total internal reflection
  return eta * incident - (eta * dot_ni + sqrt(k)) * normal;
}
```
- `eta = 1.0 / refractive_index` (air to glass)
- Incident ray is always (0, 1) — straight down from viewer

**Files to modify**: `src/webgpu/shader.ts`

**Expected Result**:
- Refracted ray direction computed per-pixel
- Can visualize as color: rays bending inward (convex) vs outward (concave)
- No texture displacement yet

---

## Step 4: Calculate UV Displacement from Refracted Ray

**Goal**: Convert refracted ray into texture coordinate offset.

**Implementation**:
- Displacement = refracted_ray.x * glass_thickness / refracted_ray.y
- glass_thickness = bezel_height_at_point + flat_glass_thickness
- Normalize displacement to UV space: `uv_offset = displacement / image_size`
- Clamp to prevent sampling outside texture

**Files to modify**: `src/webgpu/shader.ts`

**Expected Result**:
- Background image distorts through glass region
- Convex glass compresses (magnifies) the view
- Concave glass expands (minifies) the view
- Effect matches the PDF demonstration

---

## Step 5: Add Specular Rim Highlight

**Goal**: Add bright edge highlights where light reflects off the glass surface.

**Implementation**:
- Define light direction uniform (e.g., 60° = upper-left)
- Calculate dot product of surface normal with light direction
- Apply to bezel region only, with falloff toward center
- Blend highlight additively over refracted image

**Files to modify**: `src/webgpu/shader.ts`

**Expected Result**:
- Bright highlight appears on glass edges facing the light
- Highlight follows bezel curve
- Intensity adjustable via uniform

---

## Step 6: Add Gaussian Blur to Background

**Goal**: Simulate frosted/depth effect by blurring background behind glass.

**Implementation Options**:
A. **Separable blur in shader**: Two-pass horizontal/vertical blur (requires render texture)
B. **Pre-blurred texture**: Load blurred version of image
C. **Box blur approximation**: Single-pass multi-sample blur

**Recommended**: Option A for quality, Option C for simplicity first.

**Files to modify**: 
- `src/webgpu/shader.ts` (blur sampling)
- `src/webgpu/renderer.ts` (if using multi-pass)

**Expected Result**:
- Background behind glass is slightly blurred
- Blur level adjustable via uniform
- Refraction still applies to blurred result

---

## Step 7: Add Saturation Boost

**Goal**: Increase color saturation within glass region for visual pop.

**Implementation**:
```wgsl
fn saturate_color(color: vec3f, amount: f32) -> vec3f {
  let gray = dot(color, vec3f(0.299, 0.587, 0.114));
  return mix(vec3f(gray), color, amount);
}
```
- Apply after refraction, before specular
- Default saturation multiplier: 1.5-4.0

**Files to modify**: `src/webgpu/shader.ts`

**Expected Result**:
- Colors within glass region appear more vivid
- Saturation amount controllable via uniform

---

## Step 8: Support Rounded Rectangle Shapes

**Goal**: Extend from circular glass to rounded rectangles (pill shapes, cards).

**Implementation**:
- Calculate signed distance to rounded rectangle
- Determine which "corner" or "edge" the pixel is in
- Map to equivalent circular bezel position
- Apply same refraction logic

**Files to modify**: `src/webgpu/shader.ts`

**Expected Result**:
- Glass effect works on rectangular shapes with rounded corners
- Can stretch horizontally/vertically for pill buttons, cards
- Bezel width consistent around entire perimeter

---

## Step 9: Interactive Controls (UI)

**Goal**: Allow real-time adjustment of glass parameters.

**Parameters**:
- `glass_thickness`: 50-500 (affects refraction strength)
- `bezel_width`: 10-100 (curved edge width)
- `refractive_index`: 1.0-2.5 (1.5 = glass, 2.4 = diamond)
- `surface_type`: convex/concave/lip selector
- `specular_angle`: 0-360°
- `specular_opacity`: 0-1
- `blur_amount`: 0-50
- `saturation`: 1-10

**Files to create/modify**:
- `src/ui/controls.ts` (new)
- `src/main.ts`
- `index.html`

**Expected Result**:
- Slider/dropdown controls visible on page
- Real-time updates when parameters change
- Presets for common looks (frosted glass, magnifying lens, etc.)

---

## Step 10: Mouse Interaction

**Goal**: Glass element follows mouse cursor.

**Implementation**:
- Track mouse position
- Update `circle_x`, `circle_y` uniforms each frame
- Optional: smooth interpolation (lerp) for fluid motion

**Files to modify**: `src/main.ts`, `src/webgpu/renderer.ts`

**Expected Result**:
- Glass circle/shape follows cursor
- Smooth, responsive movement
- Works with touch events on mobile

---

## Summary of Key Differences: CSS/SVG vs WebGPU

| Aspect | CSS/SVG | WebGPU |
|--------|---------|--------|
| Displacement | Pre-computed image, `feDisplacementMap` | Real-time per-pixel calculation |
| Performance | Limited by image generation | GPU-accelerated, 60fps+ |
| Flexibility | Fixed resolution map | Resolution-independent |
| Blur | `feGaussianBlur` filter | Custom shader implementation |
| Browser support | Chrome-only for backdrop-filter | WebGPU-capable browsers |

---

## File Structure After Implementation

```
src/
├── main.ts                 # Entry point, mouse handling
├── webgpu/
│   ├── renderer.ts         # WebGPU setup, render loop
│   ├── shader.ts           # WGSL shader with glass effect
│   └── texture.ts          # Image loading (existing)
└── ui/
    └── controls.ts         # Parameter sliders
```

---

## Reference Files from kube.io

| File | Purpose | Key Takeaway |
|------|---------|--------------|
| `lib/surfaceEquations.ts` | Height functions | 4 surface types, `x` = distance from edge |
| `lib/displacementMap.ts` | Ray tracing | `refract()` function, displacement = ray.x * height / ray.y |
| `lib/specular.ts` | Rim light | Dot product with light direction, edge falloff |
| `components/Filter.tsx` | SVG pipeline | Order: blur → displace → saturate → blend specular |
| `graphics/Playground.tsx` | Interactive demo | Shows all parameters wired together |

---

## Detailed Implementation Notes from Source Code

### Refraction Function (from `displacementMap.ts:16-28`)

```typescript
// eta = 1 / refractive_index (e.g., 1/1.5 = 0.667 for glass)
// Incident ray is always [0, 1] (straight down)
function refract(normalX: number, normalY: number): [number, number] | null {
  const dot = normalY;  // dot product of incident [0,1] with normal
  const k = 1 - eta * eta * (1 - dot * dot);
  if (k < 0) return null;  // Total internal reflection
  const kSqrt = Math.sqrt(k);
  return [
    -(eta * dot + kSqrt) * normalX,
    eta - (eta * dot + kSqrt) * normalY,
  ];
}
```

### Surface Normal Calculation (from `displacementMap.ts:35-39`)

```typescript
// Numerical derivative at position x
const dx = x < 1 ? 0.0001 : -0.0001;
const y2 = bezelHeightFn(x + dx);
const derivative = (y2 - y) / dx;
const magnitude = Math.sqrt(derivative * derivative + 1);
const normal = [-derivative / magnitude, -1 / magnitude];
```

### Displacement Calculation (from `displacementMap.ts:44-50`)

```typescript
// Total glass thickness at this point
const remainingHeightOnBezel = y * bezelWidth;
const remainingHeight = remainingHeightOnBezel + glassThickness;

// Displacement = horizontal travel based on refracted ray angle
return refracted[0] * (remainingHeight / refracted[1]);
```

### 2D Map Generation (from `displacementMap.ts:90-144`)

Key insights for WebGPU implementation:
- Object is centered in canvas
- For each pixel, determine which "corner quadrant" it's in
- Calculate distance from center of nearest corner circle
- Use radial direction (cos, sin) to rotate the 1D displacement
- Encode: `R = 128 + dX * 127`, `G = 128 + dY * 127`
- Neutral color (no displacement) = `rgb(128, 128, 0)`

### Specular Calculation (from `specular.ts:77-87`)

```typescript
// Light direction vector from angle (e.g., 60° = upper-left)
const specular_vector = [Math.cos(specularAngle), Math.sin(specularAngle)];

// Surface normal direction (radial)
const cos = x / distanceFromCenter;
const sin = -y / distanceFromCenter;

// How much the surface faces the light
const dotProduct = Math.abs(cos * specular_vector[0] + sin * specular_vector[1]);

// Falloff from edge
const coefficient = dotProduct * Math.sqrt(1 - (1 - distanceFromSide)²);

// Final color
const color = 255 * coefficient;
const finalOpacity = color * coefficient * opacity;
```

### SVG Filter Chain (from `Filter.tsx`)

The order matters:
1. **feColorMatrix** (optional): Brighten/darken based on theme
2. **feGaussianBlur**: Soften background (stdDeviation = blur amount)
3. **feDisplacementMap**: Apply refraction (scale = maximumDisplacement * ratio)
4. **feColorMatrix type="saturate"**: Boost saturation (values = "4" means 4x)
5. **feComposite + feBlend**: Layer specular highlight on top

### Parameter Ranges (from `Playground.tsx`)

| Parameter | Min | Max | Default | Notes |
|-----------|-----|-----|---------|-------|
| bezelWidth | 0 | 100 | 60 | Pixels of curved edge |
| glassThickness | 0 | 100 | 50 | Flat glass depth |
| scaleRatio | 0 | 1 | 1 | Multiplier for displacement |
| refractiveIndex | - | - | 1.5 | Glass = 1.5, Diamond = 2.4 |
| samples | - | - | 512 | Pre-computation resolution |

---

## WebGPU-Specific Considerations

### Advantages of Real-Time Shader Approach

1. **No pre-computation needed**: Calculate displacement per-pixel in fragment shader
2. **Resolution-independent**: Works at any canvas size without regenerating maps
3. **Smooth animations**: Can interpolate all parameters smoothly
4. **Single pass possible**: All effects (refraction, blur, specular) in one shader

### Potential Optimizations

1. **Separable blur**: If blur is needed, use two-pass horizontal/vertical
2. **LUT for surface function**: Pre-compute height values in a 1D texture
3. **Early-out for flat region**: Skip refraction calculations in glass center
4. **Mipmap sampling**: Use appropriate mip level for blur effect

### WGSL Shader Structure

```wgsl
// Uniforms
struct Params {
  image_size: vec2f,
  canvas_size: vec2f,
  glass_center: vec2f,
  glass_radius: f32,
  bezel_width: f32,
  glass_thickness: f32,
  refractive_index: f32,
  surface_type: u32,      // 0=convex_circle, 1=squircle, 2=concave, 3=lip
  specular_angle: f32,
  specular_opacity: f32,
  saturation: f32,
  blur_radius: f32,
}

// Fragment shader pseudocode
fn fs_main(uv: vec2f, pixel: vec2f) -> vec4f {
  let to_center = pixel - glass_center;
  let dist = length(to_center);
  let sdf = glass_radius - dist;  // Signed distance from edge
  
  if (sdf < 0.0) {
    return textureSample(background, sampler, uv);  // Outside glass
  }
  
  let bezel_t = clamp(sdf / bezel_width, 0.0, 1.0);
  
  if (bezel_t >= 1.0) {
    // Inside flat center - no refraction, just tint
    return apply_glass_tint(textureSample(...));
  }
  
  // In bezel region - calculate refraction
  let height = surface_fn(bezel_t);
  let normal = calculate_normal(bezel_t);
  let refracted = refract_ray(vec2f(0, 1), normal, 1.0 / refractive_index);
  let total_height = height * bezel_width + glass_thickness;
  let displacement = refracted.x * total_height / refracted.y;
  
  // Convert displacement to UV offset
  let direction = normalize(to_center);
  let uv_offset = direction * displacement / image_size;
  
  var color = textureSample(background, sampler, uv + uv_offset);
  color = saturate_color(color, saturation);
  color += calculate_specular(direction, specular_angle) * specular_opacity;
  
  return color;
}
```
