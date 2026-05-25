var k=Object.defineProperty;var L=(e,i,t)=>i in e?k(e,i,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[i]=t;var m=(e,i,t)=>L(e,typeof i!="symbol"?i+"":i,t);(function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))n(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const l of s.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&n(l)}).observe(document,{childList:!0,subtree:!0});function t(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(r){if(r.ep)return;r.ep=!0;const s=t(r);fetch(r.href,s)}})();const O=`
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

    // Gradient colors (teal to pink) - more saturated
    let color_tl = vec3f(0.20, 0.78, 0.76);
    let color_mid = vec3f(0.55, 0.74, 0.73);
    let color_br = vec3f(0.92, 0.65, 0.65);

    let t = (uv.x + uv.y) * 0.5;
    var bg_color: vec3f;
    if (t < 0.5) {
      bg_color = mix(color_tl, color_mid, t * 2.0);
    } else {
      bg_color = mix(color_mid, color_br, (t - 0.5) * 2.0);
    }

    // Grid - fixed pixel size for cells
    let grid_size = uniforms.grid_cell_size;
    let line_width = 3.0;
    let anim_offset = time * uniforms.grid_speed;
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
    // The 0.5 factor matches SVG feDisplacementMap behavior (uses XC - 0.5 formula)
    // Scale by glass size to maintain proportional appearance (reference uses radius=110)
    let size_scale = uniforms.glass_radius / 110.0;
    let displacement = calculate_displacement(
      bezel_t,
      uniforms.surface_type,
      uniforms.bezel_width,
      uniforms.glass_thickness
    ) * uniforms.scale_ratio * 0.5 * size_scale;

    // Direction from center (normalized)
    let direction = to_pixel / max(distance_from_center, 0.001);

    // Apply displacement (rays bend toward center for convex glass)
    let displaced_pixel = pixel - direction * displacement;

    // Sample background at displaced position
    let color = sample_background(displaced_pixel, uniforms.time);

    return vec4f(color, 1.0);
  }
`;function R(e,i,t){const n=e.createShaderModule({code:O}),r=e.createPipelineLayout({bindGroupLayouts:[t]});return e.createRenderPipeline({layout:r,vertex:{module:n,entryPoint:"vs_main"},fragment:{module:n,entryPoint:"fs_main",targets:[{format:i}]},primitive:{topology:"triangle-strip"}})}function F(e){return e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]})}function D(e,i,t){return e.createBindGroup({layout:i,entries:[{binding:0,resource:{buffer:t}}]})}class A{constructor(i){m(this,"canvas");m(this,"device");m(this,"context");m(this,"format");m(this,"pipeline");m(this,"bindGroup");m(this,"uniformBuffer");m(this,"startTime",performance.now());m(this,"glassParams",{bezelWidth:60,glassThickness:50,scaleRatio:1,surfaceType:0,gridCellSize:105,gridSpeed:40});this.canvas=i}async init(){var n;const i=await((n=navigator.gpu)==null?void 0:n.requestAdapter());if(!i)throw new Error("WebGPU not supported");this.device=await i.requestDevice(),this.context=this.canvas.getContext("webgpu"),this.format=navigator.gpu.getPreferredCanvasFormat(),this.context.configure({device:this.device,format:this.format}),this.uniformBuffer=this.device.createBuffer({size:48,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});const t=F(this.device);this.bindGroup=D(this.device,t,this.uniformBuffer),this.pipeline=R(this.device,this.format,t),window.addEventListener("resize",()=>this.resizeCanvas()),this.resizeCanvas()}resizeCanvas(){const i=window.devicePixelRatio||1,t=this.canvas.clientWidth*i,n=this.canvas.clientHeight*i;(this.canvas.width!==t||this.canvas.height!==n)&&(this.canvas.width=t,this.canvas.height=n)}render(){this.resizeCanvas();const i=Math.min(this.canvas.width,this.canvas.height)*.35,t=(performance.now()-this.startTime)/1e3,n=new Float32Array([this.canvas.width,this.canvas.height,t,this.canvas.width/2,this.canvas.height/2,i,this.glassParams.bezelWidth,this.glassParams.glassThickness,this.glassParams.scaleRatio,this.glassParams.surfaceType,this.glassParams.gridCellSize,this.glassParams.gridSpeed]);this.device.queue.writeBuffer(this.uniformBuffer,0,n);const r=this.device.createCommandEncoder(),s=r.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:{r:.1,g:.1,b:.12,a:1},loadOp:"clear",storeOp:"store"}]});s.setPipeline(this.pipeline),s.setBindGroup(0,this.bindGroup),s.draw(4),s.end(),this.device.queue.submit([r.finish()])}}const U={"convex-circle":e=>Math.sqrt(1-(1-e)**2),"convex-squircle":e=>Math.pow(1-Math.pow(1-e,4),1/4),concave:e=>1-Math.sqrt(1-(1-e)**2),lip:e=>{const i=Math.pow(1-Math.pow(1-e*2,4),.25),t=1-Math.sqrt(1-(1-e)**2)+.1,n=6*e**5-15*e**4+10*e**3;return i*(1-n)+t*n}};function W(e,i,t,n,r=128){const s=1/n,l=U[t];function p(a,d){const c=d,h=1-s*s*(1-c*c);if(h<0)return null;const u=Math.sqrt(h);return[-(s*c+u)*a,s-(s*c+u)*d]}return Array.from({length:r},(a,d)=>{const c=d/r,h=l(c),u=c<1?1e-4:-1e-4,v=(l(c+u)-h)/u,w=Math.sqrt(v*v+1),z=[-v/w,-1/w],o=p(z[0],z[1]);if(o){const _=h*i+e;return o[0]*(_/o[1])}else return 0})}function V(e,i,t,n=1){const r=e.getContext("2d");if(!r)return;const s=window.devicePixelRatio||1,l=e.clientWidth;e.width=l*s,e.height=l*s;const p=r.createImageData(e.width,e.height),a=p.data,d=Math.max(...i.map(Math.abs),1),c=l*s/2-20*s,h=e.width/2,u=e.height/2,f=t/110*c,v=90,w=106,z=80;for(let o=0;o<a.length;o+=4)a[o]=v,a[o+1]=w,a[o+2]=z,a[o+3]=255;for(let o=0;o<e.height;o++)for(let g=0;g<e.width;g++){const _=g-h,y=o-u,x=Math.sqrt(_*_+y*y),P=c-x;if(P<0||P>f)continue;const b=P/f,M=Math.min(i.length-1,Math.floor(b*i.length)),C=(i[M]||0)/d*n,q=x>.001?_/x:0,G=x>.001?y/x:0,S=-q*C,B=-G*C,I=Math.round(128+S*127),T=Math.round(128+B*127),E=(o*e.width+g)*4;a[E]=I,a[E+1]=T,a[E+2]=0,a[E+3]=255}for(let o=0;o<e.height;o++)for(let g=0;g<e.width;g++){const _=g-h,y=o-u,x=Math.sqrt(_*_+y*y);if(c-x>f){const b=(o*e.width+g)*4;a[b]=128,a[b+1]=128,a[b+2]=0,a[b+3]=255}}r.putImageData(p,0,0)}const N=1.5,H={"convex-circle":0,"convex-squircle":1,concave:2,lip:3};async function X(){const e=document.getElementById("mainCanvas"),i=document.getElementById("displacementMap");if(!e||!i)throw new Error("Canvas elements not found");const t=new A(e);await t.init();let n="convex-circle";function r(){const f=W(t.glassParams.glassThickness,t.glassParams.bezelWidth,n,N,128);V(i,f,t.glassParams.bezelWidth,t.glassParams.scaleRatio)}r(),console.log("Initial Grid Cell Size:",t.glassParams.gridCellSize),console.log("Initial Grid Speed:",t.glassParams.gridSpeed);const s=document.querySelectorAll(".surface-btn");s.forEach(f=>{f.addEventListener("click",()=>{s.forEach(v=>v.classList.remove("active")),f.classList.add("active"),n=f.getAttribute("data-surface"),t.glassParams.surfaceType=H[n],r()})});const l=document.getElementById("bezelWidth"),p=document.getElementById("glassThickness"),a=document.getElementById("scaleRatio"),d=document.getElementById("gridCellSize");l==null||l.addEventListener("input",()=>{t.glassParams.bezelWidth=parseInt(l.value),r()}),p==null||p.addEventListener("input",()=>{t.glassParams.glassThickness=parseInt(p.value),r()}),a==null||a.addEventListener("input",()=>{t.glassParams.scaleRatio=parseFloat(a.value),r()}),d==null||d.addEventListener("input",()=>{t.glassParams.gridCellSize=parseFloat(d.value),console.log("Grid Cell Size:",t.glassParams.gridCellSize)});const c=document.getElementById("gridSpeed");c==null||c.addEventListener("input",()=>{t.glassParams.gridSpeed=parseFloat(c.value),console.log("Grid Speed:",t.glassParams.gridSpeed)}),new ResizeObserver(()=>{r()}).observe(i);function u(){t.render(),requestAnimationFrame(u)}u()}X().catch(console.error);
