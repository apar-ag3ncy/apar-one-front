"use client";

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { clients, copy, type Language } from '@/components/journey/copy';
import { FooterContacts } from '@/components/layout/footer-contacts';
import { useFlight } from '@/components/journey/use-flight';
import { useAmbience } from '@/components/journey/ambience';
import css from '@/styles/journey.module.css';

const Film = dynamic(() => import('@/components/journey/film'), { ssr: false });
const format = (n: number) => String(n).padStart(2, '0');

export function JourneySection() {
  const viewport = useRef<HTMLDivElement>(null);
  const [language, setLanguage] = useState<Language>('en');
  const dialog = useRef<HTMLDialogElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const chapterFocus = useRef<HTMLDivElement>(null);
  const source = copy[language], limit = source.names.length - 1;
  const { chapter: stage, target, atEnd, position, visible, go, step } = useFlight(viewport, screen, limit);
  const { enabled, toggle } = useAmbience(stage, visible);
  const paragraphs = source.lines[stage];

  useEffect(() => {
    const root = screen.current!;
    function key(event: KeyboardEvent) {
      if (dialog.current?.open || event.defaultPrevented || event.altKey || event.metaKey || event.ctrlKey) return;
      if (event.key === ' ' && (event.target as HTMLElement)?.closest('button,a')) return;
      const direction = ['ArrowRight','ArrowDown','PageDown',' '].includes(event.key) ? 1 :
        ['ArrowLeft','ArrowUp','PageUp'].includes(event.key) ? -1 : 0;
      if ((direction < 0 && position.current === 0) || (direction > 0 && position.current === limit)) return;
      if (direction) { event.preventDefault(); step(direction); }
      else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); go(event.key === 'Home' ? 0 : limit); }
    }
    root.addEventListener('keydown', key);
    return () => root.removeEventListener('keydown', key);
  }, [go,step,limit,position]);

  const focusOnArrival = useRef(false);
  useEffect(() => {
    if (stage === 1 && focusOnArrival.current) {
      chapterFocus.current?.focus({ preventScroll: true }); focusOnArrival.current = false;
    }
  }, [stage]);
  function enter() { focusOnArrival.current = true; step(1); }
  function contact() { dialog.current?.showModal(); }
  return (
    <div ref={viewport} className={css.journeyTrack} lang={language} data-journey-ready>
      <div className={css.markers} aria-hidden="true">{copy.en.names.map(name => <i key={name}/>)}</div>
      <div ref={screen} className={css.screen} data-stage={stage}>
        <div aria-hidden="true" className={css.set}><Film position={position} target={stage} active={visible}/></div>
        <div className={css.glass} aria-hidden="true"/>
        <div className={css.header}>
          {target>0 && <nav className={css.map} aria-label={source.chapters}>
            <div className={css.stops}>{source.names.map((name,i) =>
              <button key={i} aria-label={format(i)+' '+name} aria-current={i===target?'step':undefined}
                onClick={() => go(i)} style={{top:Math.pow((i-3)/3,2)*8}}><span/></button>)}</div>
            <span className={css.mapLabel}>{format(target)} · {source.names[target]}</span>
          </nav>}
          <div className={css.tools}>
            <button className={css.sound} aria-label={source.sound} aria-pressed={enabled} onClick={toggle}>
              {[0,1,2,3,4].map(i=><i key={i}/>)}</button>
            <div className={css.language} aria-label="Language">
              <button aria-label="English" aria-pressed={language==='en'} onClick={()=>setLanguage('en')}>EN</button>
              <button lang="hi" aria-label="हिन्दी" aria-pressed={language==='hi'} onClick={()=>setLanguage('hi')}>हि</button>
            </div>
            <button className={css.control} onClick={contact}>{source.contact}</button>
          </div>
        </div>
        {stage===0 ? <div className={css.opening}>
          <h2>{source.title}</h2><p>{source.by}<br/>{source.studio}</p>
          <button className={css.control} onClick={enter}>{source.enter}</button>
        </div> : <>
          <div className={css.log} key={stage+'-'+language} tabIndex={-1} ref={chapterFocus}>
            <h2 className={css.tag}>{source.names[stage]} <span>{format(stage)}/06</span></h2>
            <div className={css.type}>
              {paragraphs.map(line => <p key={line}>{line}</p>)}
            </div>
            {stage===6 && <button onClick={contact} className={css.control}>{source.contact}</button>}
          </div>
          {stage===5 && <div className={css.reel} aria-label={source.names[5]}>
            <div className={css.track}>{[0,1].map(group=><ul key={group} aria-hidden={group===1 || undefined}>
              {clients.map(([name,slug])=><li key={slug}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={'/logos/'+slug+'.png'} alt={name} width="148" height="80"/></li>)}
            </ul>)}</div>
          </div>}
        </>}
        <p className={css.sr} role="status">{format(stage)} · {source.names[stage]}</p>
        <div className={css.footer}>
          <span>{source.city}</span>
          {atEnd
            ? <a className={css.cue} href="#apar-galaxy" aria-label={source.galaxy}><span className={css.mouse}><i/></span></a>
            : <button className={css.cue} onClick={()=>step(1)} aria-label={source.next}><span className={css.mouse}><i/></span></button>}
          <div><button onClick={contact}>{source.email}</button><Link href="/work" prefetch={false}>{source.work}</Link></div>
        </div>
        <dialog data-lenis-prevent ref={dialog} className={css.dialog} aria-labelledby="flight-contact" onClick={e=>{if(e.target===dialog.current) dialog.current.close();}}>
          <section><h2 id="flight-contact">{source.send}</h2><FooterContacts icons={false}/>
          <form method="dialog"><button className={css.control}>{source.close}</button></form></section>
        </dialog>
      </div>
    </div>
  );
}
