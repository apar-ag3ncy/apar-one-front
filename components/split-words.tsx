"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ComponentType, ElementType, ReactNode } from "react";

// The wrapper tag is rendered through a component-typed alias on purpose:
// @react-three/fiber (used by the exploded-ring stage) merges its three.js
// element types into the global JSX map, and JSX on a bare `ElementType`
// union then resolves its props to `never`.
type TagProps = { className?: string; children?: ReactNode };

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Masked word-stagger reveal (Framer Motion) - each word rises out of an
 * overflow-hidden box with a slight rotate, matching the design's
 * `.split-words` effect.
 */
export function SplitWords({
  text,
  as: Tag = "span",
  className,
}: {
  text: string;
  as?: ElementType;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const words = text.trim().split(/\s+/);
  const Wrapper = Tag as ComponentType<TagProps>;
  return (
    <Wrapper className={className}>
      {words.map((w, i) => (
        <span key={i}>
          <span
            style={{
              display: "inline-block",
              overflow: "hidden",
              verticalAlign: "top",
              padding: ".04em .16em .1em",
              margin: "0 -.16em -.1em",
            }}
          >
            <motion.span
              style={{ display: "inline-block" }}
              initial={reduce ? false : { y: "105%", rotate: 1, opacity: 0.2 }}
              whileInView={{ y: 0, rotate: 0, opacity: 1 }}
              viewport={{ once: true, margin: "0px 0px -7% 0px" }}
              transition={{ duration: reduce ? 0 : 0.8, ease: EASE, delay: reduce ? 0 : i * 0.04 }}
            >
              {w}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Wrapper>
  );
}
