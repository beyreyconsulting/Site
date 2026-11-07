import { m, Variants, HTMLMotionProps } from "framer-motion";
import { ReactNode, Suspense } from "react";

/* ═══════════════════════════════════════════════════
   ANIMATION VARIANTS
═══════════════════════════════════════════════════ */

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export const slideInFromBottom: Variants = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export const hoverScale = {
  scale: 1.02,
  transition: { duration: 0.2 },
};

export const hoverLift = {
  y: -4,
  boxShadow: "0 12px 40px rgba(200,151,26,0.15)",
  transition: { duration: 0.3 },
};

export const tapScale = {
  scale: 0.98,
};

/* ═══════════════════════════════════════════════════
   ANIMATED COMPONENTS
═══════════════════════════════════════════════════ */

interface MotionDivProps extends HTMLMotionProps<"div"> {
  children?: ReactNode;
}

export function MotionFade({ children, ...props }: MotionDivProps) {
  return (
    <m.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={fadeIn}
      {...props}
    >
      {children}
    </m.div>
  );
}

export function MotionFadeUp({ children, ...props }: MotionDivProps) {
  return (
    <m.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={fadeInUp}
      {...props}
    >
      {children}
    </m.div>
  );
}

export function MotionStagger({ children, ...props }: MotionDivProps) {
  return (
    <m.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={staggerContainer}
      {...props}
    >
      {children}
    </m.div>
  );
}

export function MotionItem({ children, ...props }: MotionDivProps) {
  return (
    <m.div variants={staggerItem} {...props}>
      {children}
    </m.div>
  );
}

/* ═══════════════════════════════════════════════════
   ANIMATED BUTTON
═══════════════════════════════════════════════════ */

interface MotionButtonProps extends HTMLMotionProps<"button"> {
  children?: ReactNode;
}

export function MotionButton({ children, ...props }: MotionButtonProps) {
  return (
    <m.button
      whileHover={hoverScale}
      whileTap={tapScale}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </m.button>
  );
}

/* ═══════════════════════════════════════════════════
   ANIMATED CARD
═══════════════════════════════════════════════════ */

interface MotionCardProps extends MotionDivProps {
  hoverLift?: boolean;
}

export function MotionCard({ children, hoverLift: shouldLift = true, ...props }: MotionCardProps) {
  return (
    <m.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-30px" }}
      variants={fadeInUp}
      whileHover={shouldLift ? hoverLift : hoverScale}
      {...props}
    >
      {children}
    </m.div>
  );
}

/* ═══════════════════════════════════════════════════
   PAGE TRANSITION
═══════════════════════════════════════════════════ */

export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4 },
};

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </m.div>
  );
}

/* ═══════════════════════════════════════════════════
   LAZY LOADED COMPONENT WRAPPER
═══════════════════════════════════════════════════ */

export function LazyLoad({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <Suspense fallback={fallback || <div style={{ minHeight: 200 }} />}>
      {children}
    </Suspense>
  );
}

/* ═══════════════════════════════════════════════════
   SCROLL-TRIGGERED ANIMATION HOOK STYLE
═══════════════════════════════════════════════════ */

export function createScrollAnimation(delay: number = 0) {
  return {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] },
  };
}

export { m };
