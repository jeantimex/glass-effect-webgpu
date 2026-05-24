var c=Object.defineProperty;var u=(r,e,t)=>e in r?c(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t;var n=(r,e,t)=>u(r,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const a of i)if(a.type==="childList")for(const o of a.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function t(i){const a={};return i.integrity&&(a.integrity=i.integrity),i.referrerPolicy&&(a.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?a.credentials="include":i.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function s(i){if(i.ep)return;i.ep=!0;const a=t(i);fetch(i.href,a)}})();async function l(r){const t=await(await fetch(r)).blob();return createImageBitmap(t)}function d(r,e){const t=r.createTexture({size:[e.width,e.height,1],format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT,mipLevelCount:1});return r.queue.copyExternalImageToTexture({source:e},{texture:t},[e.width,e.height]),t}const f=`
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
`;function h(r,e,t){const s=r.createShaderModule({code:f}),i=r.createPipelineLayout({bindGroupLayouts:[t]});return r.createRenderPipeline({layout:i,vertex:{module:s,entryPoint:"vs_main"},fragment:{module:s,entryPoint:"fs_main",targets:[{format:e}]},primitive:{topology:"triangle-strip"}})}function m(r){return r.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:"float",viewDimension:"2d"}},{binding:1,visibility:GPUShaderStage.FRAGMENT,sampler:{type:"filtering"}},{binding:2,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}}]})}function p(r,e,t,s,i){return r.createBindGroup({layout:e,entries:[{binding:0,resource:t.createView()},{binding:1,resource:s},{binding:2,resource:{buffer:i}}]})}class g{constructor(e){n(this,"canvas");n(this,"device");n(this,"context");n(this,"format");n(this,"pipeline");n(this,"bindGroup");n(this,"uniformBuffer");n(this,"imageBitmap");n(this,"startTime",performance.now());this.canvas=e}async init(e){var o;const t=await((o=navigator.gpu)==null?void 0:o.requestAdapter());if(!t)throw new Error("WebGPU not supported");this.device=await t.requestDevice(),this.context=this.canvas.getContext("webgpu"),this.format=navigator.gpu.getPreferredCanvasFormat(),this.context.configure({device:this.device,format:this.format}),this.imageBitmap=await l(e);const s=d(this.device,this.imageBitmap),i=this.device.createSampler({magFilter:"linear",minFilter:"linear"});this.uniformBuffer=this.device.createBuffer({size:48,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});const a=m(this.device);this.bindGroup=p(this.device,a,s,i,this.uniformBuffer),this.pipeline=h(this.device,this.format,a),window.addEventListener("resize",()=>this.resizeCanvas()),this.resizeCanvas()}resizeCanvas(){const e=window.devicePixelRatio||1,t=this.canvas.clientWidth*e,s=this.canvas.clientHeight*e;(this.canvas.width!==t||this.canvas.height!==s)&&(this.canvas.width=t,this.canvas.height=s)}render(){this.resizeCanvas();const e=Math.min(this.canvas.width,this.canvas.height)*.22,t=(performance.now()-this.startTime)/1e3,s=new Float32Array([this.imageBitmap.width,this.imageBitmap.height,this.canvas.width,this.canvas.height,this.canvas.width*.5,this.canvas.height*.5,e,e*.24,t,0,0,0]);this.device.queue.writeBuffer(this.uniformBuffer,0,s);const i=this.device.createCommandEncoder(),a=i.beginRenderPass({colorAttachments:[{view:this.context.getCurrentTexture().createView(),clearValue:{r:.1,g:.1,b:.12,a:1},loadOp:"clear",storeOp:"store"}]});a.setPipeline(this.pipeline),a.setBindGroup(0,this.bindGroup),a.draw(4),a.end(),this.device.queue.submit([i.finish()])}}async function _(){const r=document.createElement("canvas");document.body.appendChild(r);const e=new g(r);await e.init("/assets/banner.jpeg");function t(){e.render(),requestAnimationFrame(t)}t()}_().catch(console.error);
