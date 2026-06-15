import * as React from "react";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

const variants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1], delay },
  }),
};

interface SectionRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article" | "li";
  id?: string;
}

/** Fade-up on scroll into view. Respects prefers-reduced-motion via Framer. */
export function SectionReveal({
  children,
  className,
  delay = 0,
  as = "div",
  id,
}: SectionRevealProps) {
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      id={id}
      className={cn(className)}
      variants={variants}
      custom={delay}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </MotionTag>
  );
}
