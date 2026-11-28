// Original screen-space camera and procedural sets. World coordinates use half
// the viewport height as one unit so the planets stay round on portrait screens.
export const vertexShader = `
varying vec2 screenUV;
void main() {
  screenUV = uv;
  gl_Position = vec4(position.xy, 0., 1.);
}`;

// Both materials use the same moving doorway and one-pixel silhouette.
export const clientsPortal = `
vec2 portalRect(vec2 p, float landing, float depart) {
  float settle = smoothstep(.30, .95, landing);
  float travel = smoothstep(.12, .55, depart);
  float width = mix(.055, aspect, settle);
  vec2 size = vec2(width, width * 2.24);
  vec2 center = vec2(.5 * aspect * settle, .035);
  if (aspect < .85) {
    float height = mix(.11, .85, settle);
    size = mix(vec2(height * .44, height), vec2(aspect * 2., height), smoothstep(.45, 1., settle));
    center = vec2(0., -.575 * settle);
  }
  center *= 1. - travel;
  size = mix(size, vec2(aspect * 2.9, 3.7), travel);
  return abs(p - center) - size * .5;
}
float portalMask(vec2 rect) {
  float aa = 1.25 / pixelHeight;
  return 1. - smoothstep(-aa, aa, max(rect.x, rect.y));
}
float roomArrival() { return smoothstep(4., 4.38, journey); }
`;

export const fragmentShader = `
precision highp float;
varying vec2 screenUV;
uniform float aspect, pixelHeight, clockTime, journey;
uniform vec2 pointer;
${clientsPortal}
// Keep APAR's ember as the accent; moonlight carries the surrounding space.
const vec3 ember = vec3(1.,.23,.075);
const vec3 apricot = vec3(.96,.66,.50);
const vec3 cream = vec3(.92,.95,.98);
const vec3 ice = vec3(.57,.72,.88);

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(.1031,.1030,.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float noise(vec2 p) {
  vec2 cell = floor(p), f = fract(p);
  f = f*f*(3.-2.*f);
  return mix(mix(hash(cell), hash(cell+vec2(1,0)), f.x),
             mix(hash(cell+vec2(0,1)),hash(cell+vec2(1)),f.x),f.y);
}
float clouds(vec2 p) {
  mat2 m = mat2(1.65,1.17,-1.17,1.65);
  return noise(p)*.54 + noise(m*p+4.)*.27 + noise(m*m*p+15.)*.13 + noise(m*m*m*p)*.06;
}
vec3 dust(vec2 p, float freq, float seed) {
  vec2 grid = p*freq + seed;
  vec2 cell = floor(grid);
  float pick = hash(cell+seed);
  vec2 pos = vec2(hash(cell+7.),hash(cell+31.))*.84+.08;
  vec2 d = fract(grid)-pos;
  float footprint = clamp(freq*1.15/pixelHeight,.032,.22);
  float radius = footprint*(.75 + 1.4*pow(pick,9.));
  float light = exp(-dot(d,d)/(radius*radius)) * smoothstep(.69,.995,pick);
  vec3 tint = mix(ice,cream,pick);
  tint = mix(tint,ember,smoothstep(.88,.99,hash(cell+11.))*.8);
  return light*tint*(.88+.12*sin(seed+pick*130.+clockTime*.4));
}
vec3 sky(vec2 p) {
  p += .0018*vec2(clockTime, -clockTime*.24);
  return dust(p,56.,1.)*.73 + dust(p*1.007,104.,20.)*.40 + dust(p,22.,8.)*.95;
}
vec3 sphere(vec3 bg, vec2 p, vec2 center, float radius, float kind) {
  vec2 s = (p-center)/radius;
  float r = length(s);
  float aa = 2./(pixelHeight*radius);
  float top = clamp(s.y*.5+.5,0.,1.);
  bg += mix(ice,apricot,.28)*.55*exp(-max(0.,r-1.)*125.)*top*(kind<.5?.07:.55);
  if (r >= 1.+aa) return bg;
  float z = sqrt(max(0., 1.-r*r));
  vec3 n = vec3(s,z);
  float edge = exp(-z*12.);
  vec3 col;
  if(kind<.5) {
    col = vec3(.006,.009,.016) + ice*.16*top*top*exp(-z*9.);
  } else if(kind<1.5) {
    float land = clouds(n.xy*4.+n.z*2.+.015*clockTime);
    col = vec3(.021,.032,.051) + ice*.16*land*(.32+top*.68)
      + mix(ice,apricot,.3)*pow(top,3.)*(exp(-z*5.)+.018);
  } else {
    float land = clouds(n.xy*5.+n.z*2.+.01*clockTime);
    float bands = clouds(n.xy*13.+land*4.);
    col = mix(vec3(.13,.21,.30),cream,smoothstep(.32,.71,land+.18*bands));
    col *= .54+.5*max(0.,dot(n,normalize(vec3(-.8,.7,.3))));
    col += edge*mix(ice,ember,.14)*.38;
  }
  return mix(bg,col,1.-smoothstep(1.-aa,1.+aa,r));
}
vec3 orbit(vec2 p, float flight) {
  float k = smoothstep(0.,1.,flight);
  vec2 q = p + pointer*.012;
  float radius = max(1.48,aspect*.99);
  float horizon = mix(.60,-.56,k);
  vec3 col = sky(q*(1.-.25*k));
  vec2 sun = q-vec2(0.,.42);
  float flare = length(sun);
  col += k*(mix(ice,ember,.18)*exp(-flare*6.)+cream*exp(-flare*16.)
             + vec3(1.)*(1.-smoothstep(.074,.105,flare)));
  if(flight>0.) col = sphere(col,q,vec2(0.,mix(-1.24,-.14,k)),.56,1.);
  return sphere(col,q,vec2(0.,horizon-radius),radius,0.);
}
vec3 portalSpace(vec2 p) {
  // Rotate within the inclined disc so stars follow ellipses around the core.
  vec2 disc = vec2(p.x + p.y*.30, (p.y - p.x*.13)*2.25);
  float radius = length(disc);
  float phase = clockTime * .18;
  float c = cos(phase), s = sin(phase);
  vec2 orbitUV = mat2(c,-s,s,c) * disc;
  float angle = atan(orbitUV.y,orbitUV.x+.00001);
  float dustCloud = clouds(orbitUV*2.6+vec2(0.,8.2));
  float arm = .5+.5*cos(3.*angle-radius*6.7+1.8*dustCloud);
  float dustLane = pow(arm,3.)*exp(-radius*1.9)*dustCloud;
  vec3 orbitingStars = dust(orbitUV,46.,1.) * exp(-radius*1.25) * (.55+4.*dustLane);
  vec3 backgroundStars = dust(p*.86,104.,20.)*.40 + dust(p*.86,22.,8.)*.70;
  float core = exp(-radius*12.);
  return vec3(.007,.012,.023) + ember*dustLane*.55 + cream*core*.32
    + orbitingStars + backgroundStars;
}
vec3 practice(vec2 p) {
  vec3 dark = vec3(.008,.013,.025)+vec3(.035,.060,.085)*exp(-dot(p,p)*2.);
  vec2 orbitUV=p-vec2(.24*aspect,-.06);
  float radius=length(vec2(orbitUV.x+orbitUV.y*.5,orbitUV.y*2.8));
  float ring=exp(-22.*abs(radius-.67-.018*sin(clockTime*.4)));
  return dark+portalSpace(orbitUV)*.62+ember*.18*ring;
}
vec3 eclipseFlight(vec2 p,float advance) {
  vec2 q=p+pointer*.012;
  float zoom=1./mix(1.,.12,smoothstep(.04,.90,advance));
  vec2 center=vec2(0.,-.14)*mix(1.,.45,advance);
  float r=.56*zoom;
  vec3 col=sky(q/(1.+.16*advance)*.75);
  float flare=length(q-center-vec2(0.,r));
  col+=mix(ice,ember,.18)*exp(-flare*5.) + cream*(1.-smoothstep(.076,.107,flare));
  vec3 disk=sphere(col,q,center,r,1.);
  float inside=1.-smoothstep(.993,1.,length(q-center)/r);
  disk=mix(disk,practice(p),inside*smoothstep(.05,.64,advance));
  float radius=max(1.48,aspect*.99);
  float horizon=mix(-.56,-2.03,smoothstep(0.,.38,advance));
  return sphere(disk,q,vec2(0.,horizon-radius),radius,0.);
}

float snowCrest(float x,float k,float layer,float horizon) {
  return horizon+.034*sin(x*3.8+layer*2.)
    +.038*noise(vec2(x*3.,layer*4.))-.29*k
    +k*k*.42*exp(-pow((x+1.64)*.94,2.));
}
vec3 snowAir(vec2 p,float arrival,float approach) {
  // The foreground ridge drifts across the camera faster than the horizon.
  float retreat=1.-arrival;
  float x=p.x+(.34*approach+.46*retreat)+pointer.x*.025;
  float horizon=-.21+.16*approach;
  float h=p.y-horizon;
  vec2 skyUV=vec2(x/(.56+max(h,0.)),1./(.32+max(h,0.)));
  float vapor=clouds(skyUV*vec2(.86,1.8)+vec2(clockTime*.014,3.));
  float canopy=clouds(vec2(x*.89,p.y*1.55)+vec2(3.2,clockTime*.007));
  vec3 twilight=mix(vec3(.21,.29,.38),vec3(.025,.044,.078),smoothstep(.02,1.15,h));
  twilight+=vec3(.055,.070,.090)*canopy;
  float shadow=smoothstep(.46,.71,vapor+canopy*.13);
  vec3 col=mix(twilight,vec3(.028,.048,.080),shadow*.60*smoothstep(-.03,.28,h));
  col+=vec3(.009,.012,.017)*(noise(skyUV*12.)-.5);
  col+=sky(p)*.18*smoothstep(.18,.75,h)*(1.-shadow);
  for(int i=0;i<6;i++) {
    float k=float(i)/5.;
    float worldX=x*(.85+.30*k)+(.10*approach+.52*retreat)*k;
    // Preserve the original wind-shaped ridges and camera parallax exactly.
    float crest=snowCrest(worldX,k,float(i),horizon);
    float below=crest-p.y;
    float slope=(snowCrest(worldX+.01,k,float(i),horizon)-snowCrest(worldX-.01,k,float(i),horizon))/.02;
    float aa=(1.+abs(slope))/pixelHeight;
    if(below<=-aa) continue;
    // Broad moonlit faces and blue hollows read as packed snow, without grit.
    float fold=clouds(vec2(worldX*2.,below*5.)+float(i)*3.);
    vec3 normal=normalize(vec3(-slope*.8,.65,.7+below*.6));
    float light=clamp(dot(normal,normalize(vec3(-.5,.8,.6))),0.,1.);
    vec3 ground=mix(vec3(.31,.42,.56),vec3(.79,.86,.93),light*.76);
    ground*=1.-.28*smoothstep(.025,.48,below);
    ground+=(fold-.5)*.018;
    ground+=vec3(.08,.09,.10)*exp(-below*below*90.)*light;
    ground=mix(vec3(.31,.40,.51),ground,.68+.32*k);
    col=mix(col,ground,smoothstep(-aa,aa,below));
  }
  return col;
}
float cross2(vec2 a,vec2 b) { return a.x*b.y-a.y*b.x; }
vec2 faceCoverage(vec2 p,vec2 a,vec2 b,vec2 c,vec2 d) {
  // Screen-space half planes stay finite even when a viewing ray is parallel
  // to the box. A one-pixel edge cannot leak across the rest of the image.
  float winding=sign(cross2(b-a,c-a));
  float edge=min(min(cross2(b-a,p-a)*winding/max(length(b-a),.00001),
                     cross2(c-b,p-b)*winding/max(length(c-b),.00001)),
                 min(cross2(d-c,p-c)*winding/max(length(d-c),.00001),
                     cross2(a-d,p-d)*winding/max(length(a-d),.00001)));
  float aa=1.25/pixelHeight;
  float width=abs(cross2(b-a,d-a))/max(length(d-a),.00001);
  return vec2(smoothstep(-aa,aa,edge)*smoothstep(0.,aa,width),edge);
}
vec2 projectDoor(vec3 corner,vec3 eye,mat3 view,float lens,vec2 framing) {
  vec3 relative=(corner-eye)*view;
  return relative.xy*(lens/max(relative.z,.01))+framing;
}
vec3 snowShot(vec2 p,float arrival,float approach) {
  float align=smoothstep(.075,.42,approach);
  float distanceToFace=mix(24.,3.93,arrival);
  // A tall viewport reaches the sides of the doorway sooner. Ease its dolly
  // forward later so the turn still reads against the landscape on a phone.
  float push=mix(pow(approach,1.6),approach,smoothstep(.62,1.32,aspect));
  if(approach>0.) distanceToFace=.17+3.76*exp(-4.1*pow(push,1.69));
  float yaw=(.51+.035*sin(clockTime*.24)+.024*pointer.x)*(1.-align);
  float elevation=mix(-.24,0.,align);
  vec3 eye=vec3(sin(yaw)*distanceToFace,elevation,cos(yaw)*distanceToFace);
  vec3 forward=normalize(-eye);
  vec3 right=normalize(cross(forward,vec3(0,1,0)));
  vec3 up=cross(right,forward);
  bool narrow=aspect<.85;
  float landingX=narrow ? aspect*.45 : aspect*.404;
  vec2 framing=vec2(landingX*mix(.16,1.,arrival),mix(-.20,narrow?-.32:.014,arrival))*(1.-align);
  float lens=1.80*(1.+smoothstep(.68,.90,approach)*max(.24,aspect-.95));
  mat3 view=mat3(right,up,forward);
  vec2 a=projectDoor(vec3(-.445,-1.,.134),eye,view,lens,framing);
  vec2 b=projectDoor(vec3(.445,-1.,.134),eye,view,lens,framing);
  vec2 c=projectDoor(vec3(.445,1.,.134),eye,view,lens,framing);
  vec2 d=projectDoor(vec3(-.445,1.,.134),eye,view,lens,framing);
  vec2 frontMask=faceCoverage(p,a,b,c,d);
  float front=frontMask.x;
  float side=0.;
  if(eye.x>.445) {
    vec2 e=projectDoor(vec3(.445,-1.,-.134),eye,view,lens,framing);
    vec2 f=projectDoor(vec3(.445,1.,-.134),eye,view,lens,framing);
    side=faceCoverage(p,b,e,f,c).x;
  }
  float coverage=front+side;
  vec3 background=vec3(0.);
  if(coverage<.999) {
    background=snowAir(p,arrival,approach);
    // A restrained contact shadow seats the doorway in the snow. Its position
    // and scale follow the same projected corners as the doorway itself.
    vec2 foot=(a+b)*.5;
    float span=length(b-a);
    vec2 shadowUV=(p-foot)/vec2(max(.012,span*.85),max(.006,span*.14));
    float contact=exp(-dot(shadowUV,shadowUV)*2.)*(1.-smoothstep(foot.y-.01,foot.y+.015,p.y));
    background*=1.-contact*.24*smoothstep(.2,.8,arrival);
  }
  if(coverage<=0.) return background;
  vec2 windowUV=p*(.90+.04*approach)+vec2((1.-align)*.43,.05)*(1.-approach);
  vec3 frontColor=mix(vec3(.009,.014,.022),portalSpace(windowUV),smoothstep(.60,.98,arrival))*(.79+.21*approach);
  float bevel=1.-smoothstep(1.25/pixelHeight,4./pixelHeight,frontMask.y);
  frontColor+=ice*.055*bevel*(1.-smoothstep(.55,.85,approach));
  vec3 surface=(frontColor*front+vec3(.026,.036,.052)*side)/coverage;
  // Sum touching faces before blending so the shared edge has no pale seam.
  return coverage>.999 ? surface : mix(background,surface,coverage);
}
vec3 polarSky(vec2 p) {
  vec2 q = p + pointer * .012;
  float horizon = exp(-5. * abs(q.y + .36));
  float airglow = exp(-2.8 * abs(q.y - .08 - .12 * sin(q.x * 1.7)));
  return vec3(.009, .020, .047) + vec3(.018, .051, .071) * horizon
    + vec3(.012, .063, .056) * airglow + sky(q) * .30;
}
vec3 roomShot(vec2 p,float landing,float depart) {
  vec2 rect=portalRect(p,landing,depart);
  float arrival=roomArrival();
  float mask=portalMask(rect)*arrival;
  if(mask>=1.) return portalSpace(p);
  vec3 roomColor=polarSky(p);
  float ground=-.19-p.y;
  if(ground>0.){
    float floorCoverage=arrival*smoothstep(0.,.05,ground);
    vec3 floorColor=vec3(.020,.033,.055)+ice*.018*exp(-ground*4.);
    roomColor=mix(roomColor,floorColor,floorCoverage);
  }
  roomColor+=ice*.065*exp(-abs(max(rect.x,rect.y))*110.)*arrival;
  if(mask<=0.) return roomColor;
  return mix(roomColor,portalSpace(p),mask);
}
vec3 transmission(vec2 p,float reveal) {
  vec2 q=p+pointer*.016;
  vec3 col=portalSpace(q);
  float mobile=1.-smoothstep(.68,.95,aspect);
  vec2 center=vec2(-aspect*.94,mix(.30,.95,mobile));
  float radius=mix(.91,.51,mobile);
  center.x-=(1.-reveal)*(radius+aspect*.19);
  vec2 uv=(q-center)/radius;
  float r=length(uv);
  float z=sqrt(max(0.,1.-r*r));
  float limb=exp(-z*4.);
  float haze=clouds(uv*3.+z*2.+vec2(.025*clockTime,1.));
  vec3 glass=sky(q+uv*(.13+.22*z))*.75+vec3(.06,.10,.15)*(haze+.29)
    +mix(ice,apricot,.18)*(limb+.27*pow(haze,3.));
  if(r<1.) {
    vec2 net=vec2(atan(uv.x,max(.08,z)),asin(clamp(uv.y,-1.,1.)))*22.;
    float mesh=min(abs(fract(net.x+net.y*.5)-.5),abs(fract(net.y-net.x*.4)-.5));
    float wire=1.-smoothstep(.015,.095,mesh);
    glass+=ice*wire*(.035+.10*limb)*haze;
  }
  col+=mix(ice,ember,.14)*.40*exp(-abs(r-1.)*33.);
  float edgeAA=1.25/(pixelHeight*radius);
  col=mix(col,glass,1.-smoothstep(1.-edgeAA,1.+edgeAA,r));
  return sphere(col,q,vec2(aspect+mix(1.1,.54,mobile)+(1.-reveal)*2.,mix(.87,-1.,mobile)),mix(1.86,.88,mobile),2.);
}
vec3 sceneColor(vec2 p) {
  if(journey<1.) return orbit(p,journey);
  if(journey<2.) return eclipseFlight(p,journey-1.);
  if(journey<3.) {
    float u=journey-2.;
    if(u<.23) return practice(p)*(1.-smoothstep(0.,.23,u));
    float travel=smoothstep(.23,.89,u);
    return snowShot(p,travel,0.)*smoothstep(.23,.60,u);
  }
  if(journey<4.) {
    float u=journey-3.;
    if(u>=.98) return polarSky(p);
    vec3 shot=snowShot(p,1.,u);
    if(u>.79) shot=mix(shot,polarSky(p),smoothstep(.79,.98,u));
    return shot;
  }
  if(journey<5.) return roomShot(p,journey-4.,0.);
  float u=journey-5.;
  if(u<=.45) return roomShot(p,1.,u);
  float reveal=smoothstep(.45,.83,u);
  return transmission(p,reveal);
}
vec3 finishLight(vec3 color) {
  // Display-referred highlight shoulder: retain the color of bright APAR
  // ribbons instead of clipping their channels independently to flat white.
  color=max(color,0.);
  float peak=max(max(color.r,color.g),color.b);
  if(peak>.78) {
    float shoulder=.78+.22*(1.-exp(-((peak-.78)/.22)));
    color*=shoulder/peak;
  }
  // Mild local contrast in the existing palette; no full-frame blur pass.
  return mix(color,color*color*(3.-2.*color),.06);
}
void main() {
  vec2 p=(screenUV*2.-1.)*vec2(aspect,1.);
  vec3 col=sceneColor(p);
  col=finishLight(col);
  float vignette=1.-.14*smoothstep(.28,1.40,length(screenUV*2.-1.));
  col*=vignette;
  col+=(hash(gl_FragCoord.xy)-.5)/255.;
  gl_FragColor=vec4(max(col,0.),1.);
}
`;
