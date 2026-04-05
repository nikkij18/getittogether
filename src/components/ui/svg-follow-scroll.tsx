"use client";

import { motion, useScroll, useTransform } from "framer-motion";

export const ScrollPath = () => {
  const { scrollYProgress } = useScroll();
  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" style={{ height: '300vh' }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 400 900"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <motion.path
          d="M 200 0
             C 320 60, 80 120, 200 240
             C 320 360, 80 420, 200 540
             C 320 660, 80 720, 200 900"
          stroke="url(#emeraldGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          style={{ pathLength }}
          className="opacity-25 dark:opacity-15"
        />
        <defs>
          <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
