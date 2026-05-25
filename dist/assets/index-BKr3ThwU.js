var R=Object.defineProperty;var T=(e,t,i)=>t in e?R(e,t,{enumerable:!0,configurable:!0,writable:!0,value:i}):e[t]=i;var p=(e,t,i)=>T(e,typeof t!="symbol"?t+"":t,i);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))n(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const l of s.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&n(l)}).observe(document,{childList:!0,subtree:!0});function i(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(r){if(r.ep)return;r.ep=!0;const s=i(r);fetch(r.href,s)}})();const I=`
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

    // Grid - fixed pixel size for cells
    let grid_size = uniforms.grid_cell_size;
    let line_width = 2.0;
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
`;function F(e,t,i){const n=e.createShaderModule({code:I}),r=e.createPipelineLayout({bindGroupLayouts:[i]});return e.createRenderPipeline({layout:r,vertex:{module:n,entryPoint:"vs_main"},fragment:{module:n,entryPoint:"fs_main",targets:[{format:t}]},primitive:{topology:"triangle-strip"}})}function S(e){return e.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]})}function D(e,t,i){return e.createBindGroup({layout:t,entries:[{binding:0,resource:{buffer:i}}]})}class A{constructor(t){p(this,"canvas");p(this,"device");p(this,"context");p(this,"format");p(this,"pipeline");p(this,"bindGroup");p(this,"uniformBuffer");p(this,"startTime",performance.now());p(this,"glassParams",{bezelWidth:60,glassThickness:50,scaleRatio:1,surfaceType:0,gridCellSize:60,gridSpeed:15});this.canvas=t}async init(){var n;const t=await((n=navigator.gpu)==null?void 0:n.requestAdapter());if(!t)throw new Error("WebGPU not supported");this.device=await t.requestDevice(),this.context=this.canvas.getContext("webgpu"),this.format=navigator.gpu.getPreferredCanvasFormat(),this.context.configure({device:this.device,format:this.format}),this.uniformBuffer=this.device.createBuffer({size:48,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});const i=S(this.device);this.bindGroup=D(this.device,i,this.uniformBuffer),this.pipeline=F(this.device,this.format,i),window.addEventListener("resize",()=>this.resizeCanvas()),this.resizeCanvas()}resizeCanvas(){const t=window.devicePixelRatio||1,i=this.canvas.clientWidth*t,n=this.canvas.clientHeight*t;(this.canvas.width!==i||this.canvas.height!==n)&&(this.canvas.width=i,this.canvas.height=n)}render(){this.resizeCanvas();const t=Math.min(this.canvas.width,this.canvas.height)*.35,i=(performance.now()-this.startTime)/1e3,n=new Float32Array([this.canvas.width,this.canvas.height,i,this.canvas.width/2,this.canvas.height/2,t,this.glassParams.bezelWidth,this.glassParams.glassThickness,this.glassParams.scaleRatio,this.glassParams.surfaceType,this.glassParams.gridCellSize,this.glassParams.gridSpeed]);this.device.queue.writeBuffer(this.uniformBuffer,0,n);const r=this.device.createCommandEncoder(),s=r.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:{r:.1,g:.1,b:.12,a:1},loadOp:"clear",storeOp:"store"}]});s.setPipeline(this.pipeline),s.setBindGroup(0,this.bindGroup),s.draw(4),s.end(),this.device.queue.submit([r.finish()])}}const U={"convex-circle":e=>Math.sqrt(1-(1-e)**2),"convex-squircle":e=>Math.pow(1-Math.pow(1-e,4),1/4),concave:e=>1-Math.sqrt(1-(1-e)**2),lip:e=>{const t=Math.pow(1-Math.pow(1-e*2,4),.25),i=1-Math.sqrt(1-(1-e)**2)+.1,n=6*e**5-15*e**4+10*e**3;return t*(1-n)+i*n}};function W(e,t,i,n,r=128){const s=1/n,l=U[i];function m(a,d){const c=d,h=1-s*s*(1-c*c);if(h<0)return null;const u=Math.sqrt(h);return[-(s*c+u)*a,s-(s*c+u)*d]}return Array.from({length:r},(a,d)=>{const c=d/r,h=l(c),u=c<1?1e-4:-1e-4,v=(l(c+u)-h)/u,w=Math.sqrt(v*v+1),z=[-v/w,-1/w],o=m(z[0],z[1]);if(o){const _=h*t+e;return o[0]*(_/o[1])}else return 0})}function V(e,t,i,n=1){const r=e.getContext("2d");if(!r)return;const s=window.devicePixelRatio||1,l=e.clientWidth;e.width=l*s,e.height=l*s;const m=r.createImageData(e.width,e.height),a=m.data,d=Math.max(...t.map(Math.abs),1),c=l*s/2-20*s,h=e.width/2,u=e.height/2,f=i/110*c,v=90,w=106,z=80;for(let o=0;o<a.length;o+=4)a[o]=v,a[o+1]=w,a[o+2]=z,a[o+3]=255;for(let o=0;o<e.height;o++)for(let g=0;g<e.width;g++){const _=g-h,y=o-u,x=Math.sqrt(_*_+y*y),P=c-x;if(P<0||P>f)continue;const b=P/f,q=Math.min(t.length-1,Math.floor(b*t.length)),M=(t[q]||0)/d*n,B=x>.001?_/x:0,C=x>.001?y/x:0,G=-B*M,k=-C*M,L=Math.round(128+G*127),O=Math.round(128+k*127),E=(o*e.width+g)*4;a[E]=L,a[E+1]=O,a[E+2]=0,a[E+3]=255}for(let o=0;o<e.height;o++)for(let g=0;g<e.width;g++){const _=g-h,y=o-u,x=Math.sqrt(_*_+y*y);if(c-x>f){const b=(o*e.width+g)*4;a[b]=128,a[b+1]=128,a[b+2]=0,a[b+3]=255}}r.putImageData(m,0,0)}const N=1.5,H={"convex-circle":0,"convex-squircle":1,concave:2,lip:3};async function X(){const e=document.getElementById("mainCanvas"),t=document.getElementById("displacementMap");if(!e||!t)throw new Error("Canvas elements not found");const i=new A(e);await i.init();let n="convex-circle";function r(){const f=W(i.glassParams.glassThickness,i.glassParams.bezelWidth,n,N,128);V(t,f,i.glassParams.bezelWidth,i.glassParams.scaleRatio)}r();const s=document.querySelectorAll(".surface-btn");s.forEach(f=>{f.addEventListener("click",()=>{s.forEach(v=>v.classList.remove("active")),f.classList.add("active"),n=f.getAttribute("data-surface"),i.glassParams.surfaceType=H[n],r()})});const l=document.getElementById("bezelWidth"),m=document.getElementById("glassThickness"),a=document.getElementById("scaleRatio"),d=document.getElementById("gridCellSize");l==null||l.addEventListener("input",()=>{i.glassParams.bezelWidth=parseInt(l.value),r()}),m==null||m.addEventListener("input",()=>{i.glassParams.glassThickness=parseInt(m.value),r()}),a==null||a.addEventListener("input",()=>{i.glassParams.scaleRatio=parseFloat(a.value),r()}),d==null||d.addEventListener("input",()=>{i.glassParams.gridCellSize=parseFloat(d.value)});const c=document.getElementById("gridSpeed");c==null||c.addEventListener("input",()=>{i.glassParams.gridSpeed=parseFloat(c.value)}),new ResizeObserver(()=>{r()}).observe(t);function u(){i.render(),requestAnimationFrame(u)}u()}X().catch(console.error);
