"use client";

import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import { clients, copy } from '@/components/journey/copy';
import { FooterContacts } from '@/components/layout/footer-contacts';
import { useFlight } from '@/components/journey/use-flight';
import { JourneyTimeline } from './journey-timeline';
import css from '@/styles/journey.module.css';

const Film = dynamic(() => import('@/components/journey/film'), { ssr: false });
const format = (n: number) => String(n).padStart(2, '0');

export function JourneySection() {
  const viewport = useRef<HTMLDivElement>(null);
  const language = 'en';
  const dialog = useRef<HTMLDialogElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const chapterFocus = useRef<HTMLDivElement>(null);
  const source = copy[language], limit = source.names.length - 1;
  const { chapter: stage, atEnd, position, visible, go, step } = useFlight(viewport, screen, limit);
  const [headline, description] = source.lines[stage];

  useEffect(() => {
    const root = screen.current!;
    function key(event: KeyboardEvent) {
      if (dialog.current?.open || event.defaultPrevented || event.altKey || event.metaKey || event.ctrlKey) return;
      if (event.key === ' ' && (event.target as HTMLElement)?.closest('button,a')) return;
      const direction = event.key === ' ' && event.shiftKey ? -1 : ['ArrowRight','ArrowDown','PageDown',' '].includes(event.key) ? 1 :
        ['ArrowLeft','ArrowUp','PageUp'].includes(event.key) ? -1 : 0;
      if (direction && step(direction)) event.preventDefault();
      else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); go(event.key === 'Home' ? 0 : limit); }
    }
    root.addEventListener('keydown', key);
    return () => root.removeEventListener('keydown', key);
  }, [go,step,limit]);

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
        <div className={css.header}>
          <JourneyTimeline names={source.names} label={source.chapters} chapter={stage} go={go}/>
        </div>
        {stage===0 ? <div className={css.opening}>
          <h2 className={css.headline}>{source.title}</h2><p className={css.detail}>{source.by}<br/>{source.studio}</p>
          <button className={css.control+' '+css.action} onClick={enter}>{source.enter}</button>
        </div> : <>
          <div className={css.log} key={stage+'-'+language} tabIndex={-1} ref={chapterFocus}>
            <p className={css.tag}>{source.names[stage]} <span>{format(stage)}/{format(limit)}</span></p>
            <h2 className={css.headline}>{headline}</h2>
            <p className={css.detail}>{description}</p>
            {stage===6 && <button onClick={contact} className={css.control+' '+css.action}>{source.send}</button>}
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
          {atEnd
            ? <a className={css.cue} href="#apar-galaxy" aria-label={source.galaxy}><span className={css.mouse}><i/></span></a>
            : <button className={css.cue} onClick={()=>step(1)} aria-label={source.next}><span className={css.mouse}><i/></span></button>}
        </div>
        <dialog data-lenis-prevent ref={dialog} className={css.dialog} aria-labelledby="flight-contact" onClick={e=>{if(e.target===dialog.current) dialog.current.close();}}>
          <section><h2 id="flight-contact">{source.send}</h2><FooterContacts icons={false}/>
          <form method="dialog"><button className={css.control}>{source.close}</button></form></section>
        </dialog>
      </div>
    </div>
  );
}
