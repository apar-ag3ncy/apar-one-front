// Mount Shuksan relief from USGS elevation data via Mapzen Terrain Tiles.
// Terrarium z12/x663–665/y1409, converted to integer metres (RG) and a baked
// northeast horizon shadow (B). https://registry.opendata.aws/terrain-tiles/
const relief = `
uniform sampler2D elevation;
float metres(vec2 uv) { return dot(texture2D(elevation, uv).rg, vec2(65280.,255.)); }
`;

const noise = `
float hash(vec2 p) {
  vec3 q = fract(p.xyx * .1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float grain(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
             mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);
}
`;

export const mountainVertex = `
${relief}
uniform float aspect, progress;
varying vec2 mapUV;
varying float depthKm;
void main() {
  // A single extra row closes the near cut edge below the camera.
  mapUV = vec2(uv.x,min(uv.y*1.01,1.));
  float height = metres(mapUV)*.001 - 5.*smoothstep(.9901,1.,uv.y);
  float x = (.5-mapUV.x)*19.32;
  float travel = progress-.5;
  depthKm = 7.1+(1.-mapUV.y)*6.44-.55*travel;
  float lens = mix(4.2,5.25,smoothstep(.60,1.55,aspect));
  vec2 projected = vec2((x-.30*travel)/aspect,height-2.58) * lens / depthKm;
  projected += vec2(.10,-.065+.045*travel);
  gl_Position = vec4(projected*depthKm, .10*depthKm-1., depthKm);
}`;

export const mountainFragment = `
${relief}
${noise}
varying vec2 mapUV;
varying float depthKm;
void main() {
  vec2 stepUV = 1./vec2(768.,256.);
  float h = metres(mapUV)*.001;
  float dx = metres(mapUV+vec2(stepUV.x,0))-metres(mapUV-vec2(stepUV.x,0));
  float dz = metres(mapUV+vec2(0,stepUV.y))-metres(mapUV-vec2(0,stepUV.y));
  vec3 n = normalize(vec3(-dx,50.3,-dz));
  vec2 ground = mapUV*vec2(19.32,6.44);
  float strata = grain(ground*vec2(34.,18.)+h*49.)*.64 + grain(ground*100.)*.36;
  float shadow = texture2D(elevation,mapUV).b;
  float sun = max(0.,dot(n,normalize(vec3(.82,.75,.55)))) * shadow;
  float snow = smoothstep(1.54,2.15,h+.17*(strata-.5)) *
    smoothstep(.48,.86,n.y+.17*(strata-.5)-.14*n.x);
  vec3 rock = mix(vec3(.047,.089,.115),vec3(.49,.53,.54),sun*.92);
  vec3 ice = mix(vec3(.17,.27,.36),vec3(.91,.95,.96),sun);
  vec3 surface = mix(rock,ice,snow) * (.90+.15*strata);
  float haze = smoothstep(7.,13.6,depthKm)*.17;
  gl_FragColor = vec4(mix(surface,vec3(.40,.53,.61),haze),1.);
}`;

export const cloudVertex = `
varying vec2 screenUV;
void main(){ screenUV=uv; gl_Position=vec4(position.xy,0.,1.); }`;

export const cloudFragment = `
${noise}
uniform float aspect, time, progress, gust;
varying vec2 screenUV;
float billows(vec2 p) {
  mat2 turn = mat2(1.74,1.12,-1.12,1.74);
  float sum=.54*grain(p);
  p=turn*p+13.8; sum+=.27*grain(p);
  p=turn*p+7.3; sum+=.13*grain(p);
  return sum+.06*grain(turn*p);
}
void main() {
  float y=screenUV.y, x=(screenUV.x-.5)*aspect;
  float wind=time*.048;
  // High cirrus drifts slowly. The nearer bank crosses the lens on the exit.
  float cirrus=billows(vec2(x*2.8-wind*.42, y*21.+x*1.8));
  float wisps=smoothstep(.42,.79,cirrus)*smoothstep(.40,.85,y)*.24;
  float exitMist=smoothstep(.52,.98,progress);
  vec2 advect=vec2(x*2.65-wind-progress*.94, y*5.4+.24*gust);
  float broad=billows(advect+vec2(2.7,.08*wind));
  float small=billows(advect*2.9+vec2(-.28*wind,broad*1.7));
  float top=.12+.19*broad+.15*small+.14*exitMist+.07*sin(x*3.3-wind*.54);
  float thickness=top-y;
  float fog=smoothstep(-.034,.115,thickness);
  float valley=exp(-abs(y-(.37+.08*sin(x*2.+.5)))*21.);
  float veil=valley*smoothstep(.34,.76,small)*.36;
  float density=1.-(1.-wisps)*(1.-veil)*(1.-fog*(.74+.25*small));
  vec3 shade=vec3(.32,.44,.52), light=vec3(.79,.86,.87);
  float rim=1.-smoothstep(-.012,.095,thickness);
  vec3 colour=mix(shade,light,clamp(.24+small*.57+rim*.28+exitMist*.18,0.,1.));
  gl_FragColor=vec4(colour,density);
}`;
