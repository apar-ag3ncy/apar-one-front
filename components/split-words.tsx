"use client";

import { motion } from "framer-motion";
import { type ElementType } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Masked word-stagger reveal (Framer Motion) — each word rises out of an
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
  const words = text.trim().split(/\s+/);
  return (
    <Tag className={className}>
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
              initial={{ y: "112%", rotate: 3, opacity: 0.2 }}
              whileInView={{ y: 0, rotate: 0, opacity: 1 }}
              viewport={{ once: true, margin: "0px 0px -7% 0px" }}
              transition={{ duration: 1, ease: EASE, delay: i * 0.055 }}
            >
              {w}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
