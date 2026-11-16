import { setImageHover } from "@/lib/motion/image-hover";
import { ImagePixelField, IMAGE_PIXEL_WIDTH, IMAGE_PIXEL_HEIGHT } from "@/lib/motion/image-pixels";

// Sampling in the original photo UVs keeps the mosaic on the curved surface.
export const imagePixelShader = `
uniform sampler2D uPixelMask;
uniform vec2 uPixelGrid;
uniform vec2 uPixelCell;
uniform float uPixelActive;
vec3 imagePixels(vec2 uv, vec3 original){
  if(uPixelActive<.5) return original;
  vec2 position=uv*uSize;
  vec2 tile=floor(position/uPixelCell);
  float strength=texture2D(uPixelMask,(tile+.5)/uPixelGrid).r;
  if(strength<.012) return original;
  vec2 q=abs(mod(position,uPixelCell)-uPixelCell*.5)-(uPixelCell*.5-vec2(1.75));
  float edge=length(max(q,0.))+min(max(q.x,q.y),0.)-1.6;
  float alpha=1.-smoothstep(-.35,.35,edge);
  vec2 sampleUv=clamp((tile+.5)*uPixelCell/uSize,vec2(0.),vec2(1.));
  return mix(original,texture2D(uImage,sampleUv).rgb,strength*alpha);
}`;

type Uniforms = { active: WebGLUniformLocation | null; grid: WebGLUniformLocation | null };

export function pixelUniforms(gl: WebGLRenderingContext, uniform: (name: string) => WebGLUniformLocation | null) {
  gl.uniform1i(uniform("uPixelMask"), 1);
  gl.uniform2f(uniform("uPixelCell"), IMAGE_PIXEL_WIDTH, IMAGE_PIXEL_HEIGHT);
  return { active: uniform("uPixelActive"), grid: uniform("uPixelGrid") };
}

/** Reuses the work grid's context and RAF; allocates only on first hover. */
export class FeaturedPixelHover {
  private field = new ImagePixelField();
  private texture: WebGLTexture | null = null;
  private textureSize = "";

  constructor(private gl: WebGLRenderingContext, private uniforms: Uniforms) {}

  move(x: number, y: number, width: number, height: number, now: number) {
    this.field.resize(width, height);
    this.field.add(x, y, now);
    setImageHover(this, true);
  }

  leave() { setImageHover(this, false); }

  clear() {
    this.leave();
    this.field.clear();
  }

  draw(width: number, height: number, now: number) {
    const { gl, field, uniforms } = this;
    gl.uniform1f(uniforms.active, 0);
    // No tile buffers for cards that have never been hovered.
    if (!field.columns) return false;
    field.resize(width, height);
    if (!field.paint(now)) return false;
    this.texture ??= gl.createTexture();
    if (!this.texture) { this.clear(); return false; }
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    const size = `${field.columns}:${field.rows}`;
    if (this.textureSize !== size) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, field.columns, field.rows, 0,
        gl.LUMINANCE, gl.UNSIGNED_BYTE, field.data);
      this.textureSize = size;
    } else {
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, field.columns, field.rows,
        gl.LUMINANCE, gl.UNSIGNED_BYTE, field.data);
    }
    gl.uniform2f(uniforms.grid, field.columns, field.rows);
    gl.uniform1f(uniforms.active, 1);
    gl.activeTexture(gl.TEXTURE0);
    return true;
  }

  dispose() {
    this.clear();
    if (this.texture) this.gl.deleteTexture(this.texture);
    this.texture = null;
  }
}
