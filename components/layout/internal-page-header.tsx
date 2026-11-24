import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";
import styles from "./internal-page-header.module.css";

/** A shared introduction for the studio's editorial index pages. */
export function InternalPageHeader({ eyebrow, title, children, label }: {
  eyebrow: string;
  title: ReactNode;
  children: ReactNode;
  label: string;
}) {
  return (
    <header className={styles.hero} data-screen-label={label}>
      <div className={`wrap ${styles.inner}`}>
        <Reveal className={`eyebrow ${styles.eyebrow}`}>
          <i className="dot" aria-hidden="true" /> {eyebrow}
        </Reveal>
        <Reveal as="h1" className={`display ${styles.title}`}>{title}</Reveal>
        <Reveal as="p" className={styles.description} i={1}>{children}</Reveal>
      </div>
    </header>
  );
}
