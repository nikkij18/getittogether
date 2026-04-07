"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";

export const ScribbleBg = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [scribbleDone, setScribbleDone] = useState(false);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const tailLength = useTransform(scrollYProgress, [0.55, 0.92], [0, 1]);
  const tailOpacity = useTransform(scrollYProgress, [0.5, 0.6], [0, 1]);

  return (
    <div
      ref={ref}
      className="absolute inset-0 pointer-events-none select-none z-0"
      style={{ overflow: "visible" }}
    >
      <svg
        className="absolute opacity-15 dark:opacity-10"
        style={{
          left: "35%",
          top: "-10%",
          width: "65%",
          height: "200%",
          overflow: "visible",
        }}
        viewBox="0 0 500 1000"
        fill="none"
        preserveAspectRatio="xMidYMin meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Scribble — draws on viewport entry */}
        <motion.path
          d="M 30 280
             C 80 180, 200 60, 180 90
             C 160 120, 60 200, 320 340
             C 440 390, 30 170, 430 150
             C 520 140, 50 380, 110 400
             C 170 420, 450 20, 390 60
             C 330 100, 140 470, 200 450
             C 260 430, 500 280, 460 310
             C 420 340, 10 110, 50 130
             C 90 150, 390 450, 350 420
             C 310 390, 80 10, 140 30
             C 200 50, 520 230, 480 250
             C 440 270, -20 350, 20 370
             C 60 390, 340 60, 300 80
             C 260 100, 460 470, 410 440
             C 360 410, 30 170, 70 200
             C 110 230, 480 100, 440 120
             C 400 140, 110 500, 160 480
             C 210 460, 410 200, 370 220
             C 330 240, 50 330, 90 350
             C 130 370, 470 410, 430 380
             C 390 350, 20 40, 60 60
             C 100 80, 350 330, 310 300
             C 270 270, 140 110, 250 250"
          stroke="#34d399"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 3.5, ease: "easeInOut" }}
          onAnimationComplete={() => setScribbleDone(true)}
        />

        {/* Tail — wavy, left-right, only after scribble done */}
        {scribbleDone && (
          <motion.path
            d="M 250 250
               C 450 290, 480 370, 350 430
               C 180 500, 20 520, 60 610
               C 100 700, 420 680, 460 760
               C 500 840, 300 880, 200 840
               C 100 800, 80 860, 160 900
               C 240 940, 380 910, 340 970
               C 300 1030, 100 1020, 80 1000"
            stroke="#34d399"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            style={{ pathLength: tailLength, opacity: tailOpacity }}
          />
        )}
      </svg>
    </div>
  );
};
