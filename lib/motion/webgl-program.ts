/** Small shared setup with deterministic cleanup, including shader failure. */
export function createMotionProgram(gl: WebGLRenderingContext, vertex: string, fragment: string) {
  const shaders: WebGLShader[] = [];
  const program = gl.createProgram();
  if (!program) return null;
  const dispose = () => {
    for (const shader of shaders) gl.deleteShader(shader);
    gl.deleteProgram(program);
  };
  for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]] as const) {
    const shader = gl.createShader(type);
    if (!shader) { dispose(); return null; }
    shaders.push(shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { dispose(); return null; }
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { dispose(); return null; }
  gl.useProgram(program);
  return { program, dispose, uniform: (name: string) => gl.getUniformLocation(program, name) };
}
