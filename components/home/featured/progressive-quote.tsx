import { AlpineArt } from '@/components/effects/alpine-quote/alpine-art';

export function ProgressiveQuote({ id, text, dark = false }: {
  id: string; text: string; dark?: boolean;
}) {
  const cinematic = id === "studio";

  const copy = <div className="pq-sticky wrap">
    <h2 id={`${id}-quote`} className="pq-copy" aria-label={text}>
      {cinematic ? <>
        <span className="pq-line" aria-hidden="true"><span className="pq-focus-word">Limitless.</span></span>{" "}
        <span className="pq-line pq-beyond" aria-hidden="true"><span className="pq-focus-word">Beyond</span>{" "}<span className="pq-focus-word">Culture.</span></span>
      </> : text.split(" ").map((word, i) => <span className="pq-word" aria-hidden="true" key={i}>{word}{" "}</span>)}
    </h2>
  </div>;

  return <section id={id}
    className={`progressive-quote${cinematic ? " is-cinematic" : ""}${dark ? " is-dark" : ""}`}
    aria-labelledby={`${id}-quote`}>
    {cinematic ? <div className="pq-scene">{copy}<AlpineArt /></div> : copy}
  </section>;
}
