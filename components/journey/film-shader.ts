// Original screen-space camera and procedural sets. World coordinates use half
// the viewport height as one unit so the planets stay round on portrait screens.
export const vertexShader = `
varying vec2 screenUV;
void main() {
  screenUV = uv;
  gl_Position = vec4(position.xy, 0., 1.);
}`;

export const fragmentShader = `
precision highp float;
varying vec2 screenUV;
uniform float aspect, pixelHeight, clockTime, journey;
uniform vec2 pointer;
// Match the ember and apricot used by the closing particle galaxy.
const vec3 ember = vec3(1.,.23,.075);
const vec3 apricot = vec3(1.,.65,.38);
const vec3 cream = vec3(.957,.929,.886);

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
  float footprint = clamp(freq*1.03/pixelHeight,.042,.26);
  float radius = footprint*(.75 + 1.4*pow(pick,9.));
  float light = exp(-dot(d,d)/(radius*radius)) * smoothstep(.69,.995,pick);
  vec3 tint = mix(mix(ember,apricot,pick), cream, hash(cell+11.));
  return light*tint*(.72+.28*sin(seed+pick*130.+clockTime*.55));
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
  bg += apricot*.55*exp(-max(0.,r-1.)*125.)*top*(kind<.5?.07:.55);
  if (r >= 1.+aa) return bg;
  float z = sqrt(max(0., 1.-r*r));
  vec3 n = vec3(s,z);
  float edge = exp(-z*12.);
  vec3 col;
  if(kind<.5) {
    col = vec3(.006,.003,.002) + apricot*.18*top*top*exp(-z*9.);
  } else if(kind<1.5) {
    float land = clouds(n.xy*4.+n.z*2.+.015*clockTime);
    col = vec3(.043,.017,.009) + apricot*.18*land*(.32+top*.68)
      + vec3(.93,.62,.39)*pow(top,3.)*(exp(-z*5.)+.018);
  } else {
    float land = clouds(n.xy*5.+n.z*2.+.01*clockTime);
    float bands = clouds(n.xy*13.+land*4.);
    col = mix(vec3(.39,.16,.075),cream,smoothstep(.32,.71,land+.18*bands));
    col *= .54+.5*max(0.,dot(n,normalize(vec3(-.8,.7,.3))));
    col += edge*apricot*.53;
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
  col += k*(vec3(.85,.51,.26)*exp(-flare*6.)+vec3(1.,.97,.84)*exp(-flare*16.)
             + vec3(1.)*(1.-smoothstep(.074,.105,flare)));
  if(flight>0.) col = sphere(col,q,vec2(0.,mix(-1.24,-.14,k)),.56,1.);
  return sphere(col,q,vec2(0.,horizon-radius),radius,0.);
}
vec3 portalSpace(vec2 p) {
  // An inclined star disc recurs inside each doorway along the flight.
  vec2 disc = vec2(p.x + p.y*.30, (p.y - p.x*.13)*2.25);
  float radius = length(disc);
  float angle = atan(disc.y,disc.x+.00001);
  float dustCloud = clouds(disc*2.6+vec2(clockTime*.014,8.2));
  float arm = .5+.5*cos(3.*angle-radius*6.7+1.8*dustCloud-clockTime*.061);
  float dustLane = pow(arm,3.)*exp(-radius*1.9)*dustCloud;
  float core = exp(-radius*12.);
  return vec3(.009,.005,.006) + ember*dustLane*.48 + apricot*core*.40
    + sky(p*.86)*(1.+2.6*dustLane);
}
vec3 practice(vec2 p) {
  vec3 dark = vec3(.012,.005,.003)+vec3(.145,.056,.022)*exp(-dot(p,p)*2.);
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
  col+=vec3(.85,.52,.32)*exp(-flare*5.) + vec3(1.,.97,.84)*(1.-smoothstep(.076,.107,flare));
  vec3 disk=sphere(col,q,center,r,1.);
  float inside=1.-smoothstep(.993,1.,length(q-center)/r);
  disk=mix(disk,practice(p),inside*smoothstep(.05,.64,advance));
  float radius=max(1.48,aspect*.99);
  float horizon=mix(-.56,-2.03,smoothstep(0.,.38,advance));
  return sphere(disk,q,vec2(0.,horizon-radius),radius,0.);
}

vec3 desertAir(vec2 p,float arrival,float approach) {
  // The foreground ridge drifts across the camera faster than the horizon.
  float retreat=1.-arrival;
  float x=p.x+(.34*approach+.46*retreat)+pointer.x*.025;
  float horizon=-.21+.16*approach;
  float h=p.y-horizon;
  vec2 skyUV=vec2(x/(.56+max(h,0.)),1./(.32+max(h,0.)));
  float vapor=clouds(skyUV*vec2(.86,1.8)+vec2(clockTime*.014,3.));
  float canopy=clouds(vec2(x*.89,p.y*1.55)+vec2(3.2,clockTime*.007));
  vec3 twilight=mix(vec3(.64,.45,.34),vec3(.35,.17,.12),smoothstep(.02,1.15,h));
  twilight+=vec3(.20,.12,.11)*canopy;
  float shadow=smoothstep(.46,.71,vapor+canopy*.13);
  vec3 col=mix(twilight,vec3(.16,.067,.039),shadow*.80*smoothstep(-.03,.28,h));
  col+=vec3(.032,.012,.002)*(noise(skyUV*12.)-.5);
  for(int i=0;i<6;i++) {
    float k=float(i)/5.;
    float worldX=x*(.85+.30*k)+(.10*approach+.52*retreat)*k;
    float crest=horizon+.034*sin(worldX*3.8+float(i)*2.)
      +.038*noise(vec2(worldX*3.,float(i)*4.))-.29*k;
    // A closer windward dune rises into frame on the left at the landing.
    crest+=k*k*.42*exp(-pow((worldX+1.64)*.94,2.));
    float below=crest-p.y;
    if(below<=-.003) continue;
    vec3 distant=mix(vec3(.51,.36,.30),vec3(.155,.078,.070),k);
    float sand=clouds(vec2(worldX*3.3,below*11.)+float(i)*3.);
    vec3 ground=distant-vec3(.09,.067,.046)*smoothstep(.005,.36,below)+(sand-.5)*(.025+.045*k);
    col=mix(col,ground,smoothstep(-.003,.003,below));
  }
  return col;
}
vec3 desertShot(vec2 p,float arrival,float approach) {
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
  vec3 ray=normalize(forward*lens+right*(p.x-framing.x)+up*(p.y-framing.y));
  vec3 halfExtent=vec3(.445,1.,.134);
  vec3 inverse=1./(ray+vec3(.0000001));
  vec3 first=(-halfExtent-eye)*inverse, last=(halfExtent-eye)*inverse;
  vec3 near=min(first,last), far=max(first,last);
  float entry=max(max(near.x,near.y),near.z),exitD=min(min(far.x,far.y),far.z);
  if(exitD>=max(0.,entry)) {
    vec3 spot=eye+ray*entry;
    if(near.z>=max(near.x,near.y)) {
      vec2 windowUV=p*(.90+.04*approach)+vec2((1.-align)*.43,.05)*(1.-approach);
      vec3 stars=portalSpace(windowUV);
      float clear=smoothstep(.60,.98,arrival);
      return mix(vec3(.040,.028,.018),stars,clear)*(.79+.21*approach);
    }
    return vec3(.057,.042,.045)+.018*noise(spot.xy*84.);
  }
  return desertAir(p,arrival,approach);
}
vec3 gate(vec2 p) {
  vec2 q = p + pointer*.022;
  float x = abs(q.x);
  float depth = 1./(.10+x);
  // The parallel walls terminate along a vertical slit. Keep a finite image
  // height at the far end, so light streams travel past the eye on each side.
  float lane = q.y*37./(.39+x*.77);
  float row = floor(lane);
  float seed = hash(vec2(row,sign(q.x)));
  float travel = depth*(.66+seed*1.53)-clockTime*(1.45+seed*.42);
  float pulse = fract(travel);
  float ribbon = smoothstep(.01,.19,pulse)*(1.-smoothstep(.43,.96,pulse));
  float core = exp(-10.*abs(fract(lane)-.46));
  float mist = clouds(vec2(q.y*2.8,depth*.57-clockTime*.23));
  float tint = noise(vec2(row*.058,depth*.40-clockTime*.19));
  vec3 copper = mix(ember*.48,ember,tint);
  vec3 amber = mix(ember,apricot,smoothstep(.24,.71,tint));
  vec3 pigment = q.x<0. ? copper : amber;
  float trail = (.16+1.55*ribbon)*(.18+core)*(.24+.76*seed);
  float flare = exp(-x*16.)*(.4+.6*mist);
  return sky(q)*.25 + pigment*(trail+.52*mist)*exp(-x*1.28)
    + cream*(flare*.75+exp(-x*100.)*.22);
}
vec3 roomShot(vec2 p,float landing,float depart) {
  bool portrait=aspect<.85;
  float settle=smoothstep(.30,.95,landing);
  float nearTravel=smoothstep(.12,.55,depart);
  float desktopWidth=mix(.055,aspect,settle);
  vec2 size=vec2(desktopWidth,desktopWidth*2.24);
  vec2 center=vec2(.5*aspect*settle,.035);
  if(portrait) {
    float height=mix(.11,.85,settle);
    size=mix(vec2(height*.44,height),vec2(aspect*2.,height),smoothstep(.45,1.,settle));
    center=vec2(0.,-.575*settle);
  }
  center*=1.-nearTravel;
  size=mix(size,vec2(aspect*2.9,3.7),nearTravel);
  vec2 rect=abs(p-center)-size*.5;
  float mask=1.-smoothstep(-.002,.002,max(rect.x,rect.y));
  vec3 roomColor=vec3(.89,.835,.75)+.047*exp(-dot(p,p)*1.4);
  float ground=-.19-p.y;
  if(ground>0.){
    float z=1./max(.011,ground);
    vec2 tile=vec2((p.x+.10*p.x*nearTravel)*z*.88,z*1.18+.30*(settle+nearTravel));
    vec2 nearest=abs(fract(tile-.5)-.5)/max(fwidth(tile),vec2(.0001));
    roomColor*=1.-.29*(1.-smoothstep(.2,1.65,min(nearest.x,nearest.y)))*smoothstep(.02,.43,ground);
  }
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
  vec3 glass=sky(q+uv*(.13+.22*z))*.75+vec3(.16,.063,.032)*(haze+.29)
    +apricot*(limb+.27*pow(haze,3.));
  if(r<1.) {
    vec2 net=vec2(atan(uv.x,max(.08,z)),asin(clamp(uv.y,-1.,1.)))*22.;
    float mesh=min(abs(fract(net.x+net.y*.5)-.5),abs(fract(net.y-net.x*.4)-.5));
    float wire=1.-smoothstep(.015,.095,mesh);
    glass+=apricot*wire*(.035+.10*limb)*haze;
  }
  col+=apricot*.45*exp(-abs(r-1.)*33.);
  col=mix(col,glass,1.-smoothstep(.996,1.002,r));
  return sphere(col,q,vec2(aspect+mix(1.1,.54,mobile)+(1.-reveal)*2.,mix(.87,-1.,mobile)),mix(1.86,.88,mobile),2.);
}
vec3 sceneColor(vec2 p) {
  if(journey<1.) return orbit(p,journey);
  if(journey<2.) return eclipseFlight(p,journey-1.);
  if(journey<3.) {
    float u=journey-2.;
    if(u<.23) return practice(p)*(1.-smoothstep(0.,.23,u));
    float travel=smoothstep(.23,.89,u);
    return desertShot(p,travel,0.)*smoothstep(.23,.60,u);
  }
  if(journey<4.) {
    float u=journey-3.;
    if(u>=.98) return gate(p);
    vec3 shot=desertShot(p,1.,u);
    if(u>.79) shot=mix(shot,gate(p),smoothstep(.79,.98,u));
    return shot;
  }
  if(journey<5.) {
    float u=journey-4.;
    vec3 white=cream;
    if(u<.19) return mix(gate(p/(1.+1.5*u)),white,smoothstep(.02,.19,u));
    return mix(white,roomShot(p,u,0.),smoothstep(.19,.38,u));
  }
  float u=journey-5.;
  if(u<=.45) return roomShot(p,1.,u);
  float reveal=smoothstep(.45,.83,u);
  return transmission(p,reveal);
}
void main() {
  vec2 p=(screenUV*2.-1.)*vec2(aspect,1.);
  vec3 col=sceneColor(p);
  float vignette=1.-.22*smoothstep(.28,1.40,length(screenUV*2.-1.));
  col*=vignette;
  col+=(hash(gl_FragCoord.xy)-.5)*.012;
  gl_FragColor=vec4(max(col,0.),1.);
}
`;
