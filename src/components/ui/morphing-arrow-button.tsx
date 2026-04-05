'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type MorphingArrowButtonProps = {
  onClick?: () => void;
  disabled?: boolean;
};

const MorphingArrowButton = ({ onClick, disabled }: MorphingArrowButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const containerVariants = {
    initial: { width: '56px' },
    hover: { width: '110px' },
  };

  const buttonVariants = {
    initial: { borderRadius: '50%', height: '56px', padding: '0' },
    hover:   { borderRadius: '14px 50px 50px 14px', height: '56px', padding: '0 10px' },
  };

  const lineVariants = {
    initial: { width: 0 },
    hover:   { width: 'calc(100% - 50px)' },
  };

  const arrowVariants = {
    initial: { x: '-50%' },
    hover:   { x: '20%' },
  };

  return (
    <div className="inline-block overflow-visible flex-shrink-0">
      <motion.div
        className="flex items-center justify-start"
        variants={containerVariants}
        initial="initial"
        animate={isHovered && !disabled ? 'hover' : 'initial'}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        onHoverStart={() => !disabled && setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <motion.button
          onClick={onClick}
          disabled={disabled}
          className={cn(
            'w-full flex items-center justify-center',
            'relative overflow-hidden cursor-pointer',
            'bg-gradient-to-r from-emerald-500 to-teal-500',
            'border-0',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          variants={buttonVariants}
          initial="initial"
          animate={isHovered && !disabled ? 'hover' : 'initial'}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <div className="relative w-full h-full flex items-center">
            <motion.div
              className="h-0.5 bg-white absolute top-1/2 -translate-y-1/2 left-5"
              variants={lineVariants}
              initial="initial"
              animate={isHovered && !disabled ? 'hover' : 'initial'}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-y-1/2"
              variants={arrowVariants}
              initial="initial"
              animate={isHovered && !disabled ? 'hover' : 'initial'}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </motion.div>
          </div>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default MorphingArrowButton;
