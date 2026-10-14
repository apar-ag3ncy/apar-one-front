"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HoverText } from "../hover-text";

type Scene = { progress: (value:number)=>void; pointer:(x:number,y:number,active?:boolean)=>void; dispose:()=>void };

function CosmicCanvas({ kind }: { kind:"galaxy"|"portrait"|"character" }) {
  const ref=useRef<HTMLDivElement>(null);
  const [motionRevision,setMotionRevision]=useState(0);
  const [status,setStatus]=useState<'preview'|'ready'|'fallback'>('preview');
  useEffect(()=>{
    const host=ref.current;if(!host)return;
    let runtime:Scene|null=null,disposed=false,started=false,timeout=0;
    const state={progress:1};const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    gsap.registerPlugin(ScrollTrigger);
    const ctx=gsap.context(()=>{
      if(reduced.matches)return;
      gsap.fromTo(state,{progress:0},{progress:1,ease:'none',onUpdate:()=>runtime?.progress(state.progress),scrollTrigger:{trigger:host.parentElement,start:'top 95%',end:'top 15%',scrub:.35}});
    },host);
    const fallback=()=>{if(!disposed){clearTimeout(timeout);runtime?.dispose();runtime=null;setStatus('fallback');}};
    const start=async()=>{
      if(started||disposed||reduced.matches)return;started=true;
      timeout=window.setTimeout(()=>{runtime?.dispose();runtime=null;disposed=true;setStatus('fallback');},12000);
      try{
        const create=kind==='galaxy'?(await import('./galaxy-scene')).createGalaxy:kind==='character'?(await import('./character-scene')).createCharacter:(await import('./portrait-scene')).createPortrait;
        if(disposed)return;
        runtime=create(host,()=>{if(!disposed){clearTimeout(timeout);setStatus('ready');}},fallback);
        runtime.progress(state.progress);
      }catch{fallback();}
    };
    const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){void start();}},{rootMargin:'250px'});observer.observe(host);
    const move=(e:PointerEvent)=>{if(e.pointerType!=='mouse')return;const r=host.getBoundingClientRect();runtime?.pointer((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);};
    const leave=()=>runtime?.pointer(0,0,false);
    const parent=host.parentElement!;parent.addEventListener('pointermove',move,{passive:true});parent.addEventListener('pointerleave',leave);parent.addEventListener('pointercancel',leave);window.addEventListener('blur',leave);
    const motionChange=()=>{setStatus(reduced.matches?'fallback':'preview');setMotionRevision(value=>value+1);};reduced.addEventListener('change',motionChange);
    return()=>{disposed=true;clearTimeout(timeout);observer.disconnect();parent.removeEventListener('pointermove',move);parent.removeEventListener('pointerleave',leave);parent.removeEventListener('pointercancel',leave);window.removeEventListener('blur',leave);reduced.removeEventListener('change',motionChange);ctx.revert();runtime?.dispose();};
  },[kind,motionRevision]);
  return <div ref={ref} className={`cosmic-canvas ${kind}-canvas`} data-status={status} aria-hidden="true" />;
}

export function GalaxyFooterArt(){
  return <div className="galaxy-art" aria-label="APĀR in a galaxy of orange-red stars">
    <div className="galaxy-eyebrow"><span>A universe of possibilities.</span><span>Made of ideas. Built by people.</span></div>
    <div className="galaxy-fallback" aria-hidden="true"><Image unoptimized src="/assets/apar-logo-cream.svg" alt="" width={519} height={288} loading="lazy"/></div>
    <CosmicCanvas kind="galaxy" />
    <Link className="galaxy-people-link" href="/team"><HoverText>Meet the people behind APĀR</HoverText><span aria-hidden="true">↗</span></Link>
  </div>;
}

/** The dedicated team page experience; separate from the shared footer. */
export function PeopleOfApar(){
  const [showPerson,setShowPerson]=useState(false);
  return <section className={`apar-people ${showPerson?'is-person':'is-character'}`} id="people-of-apar" aria-labelledby="apar-people-title" data-screen-label="People of APĀR">
    <div className="people-fallback" aria-hidden="true"><Image key={showPerson?'person':'character'} unoptimized src={showPerson?'/people/suraj-cutout.png':'/people/feline-particles.webp'} alt="" width={showPerson?1254:1774} height={showPerson?1254:887} loading="lazy"/></div>
    <CosmicCanvas key={showPerson?'person':'character'} kind={showPerson?'portrait':'character'} />
    <div className="people-top"><span className="people-index">[[ &nbsp; {showPerson?'002':'001'} &nbsp; ]]</span><span className="people-calibration" aria-hidden="true"/><div><h1 id="apar-people-title">TEAM</h1><p>The people of APĀR</p></div></div>
    <div className="people-reticle" aria-hidden="true"><span>+</span><span>+</span><span>+</span><span>+</span><span>+</span></div>
    <div className="people-bottom"><div className="people-identity" aria-live="polite"><span className="people-id-dot" aria-hidden="true">∷</span><div><h3>{showPerson?'Suraj Yadav':'APĀR'}</h3><p>{showPerson?'Office Admin':'Creative character'}</p></div></div><button className="people-next" onClick={()=>setShowPerson(value=>!value)} aria-label={showPerson?'Show the APĀR character':'Meet Suraj Yadav'} aria-pressed={showPerson}><svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M8 24h32M27 11l13 13-13 13" stroke="currentColor" strokeWidth="1.5"/></svg></button><p className="people-note">Behind every idea is a person.<br/>Meet the people who make APĀR.</p></div>
    <div className="people-edge"><span>APĀR / PEOPLE</span><a href="#top">Back to top ↑</a></div>
  </section>;
}
