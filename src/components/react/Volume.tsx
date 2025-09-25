'use client';

import { AnimatePresence, motion } from 'motion/react';
import { Fragment, useState } from 'react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useImperativeHandle, useRef } from 'react';

export interface VolumeIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface VolumeIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
  isActive: boolean;
  setIsActive: (isActive: boolean) => void;
}

const VolumeIcon = forwardRef<VolumeIconHandle, VolumeIconProps>(
  ({ isActive, setIsActive, className, size = 28, ...props }, ref) => {
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: () => setIsActive(true),
        stopAnimation: () => setIsActive(false),
      };
    });

    return (
      <div
        className={className}
        {...props}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
          <AnimatePresence mode="wait" initial={false}>
            {isActive ? (
              <Fragment key="volume-icon-active">
                <motion.path
                  d="M16 9a5 5 0 0 1 0 6"
                  animate={{ opacity: 1, transition: { delay: 0.1 } }}
                  initial={{ opacity: 0 }}
                  exit={{ opacity: 0 }}
                />
                <motion.path
                  d="M19.364 18.364a9 9 0 0 0 0-12.728"
                  animate={{ opacity: 1, transition: { delay: 0.2 } }}
                  initial={{ opacity: 0 }}
                  exit={{ opacity: 0 }}
                />
              </Fragment>
            ) : (
              <Fragment key="volume-icon-inactive">
                <motion.line
                  x1="22"
                  x2="16"
                  y1="9"
                  y2="15"
                  animate={{
                    pathLength: [0, 1],
                    opacity: [0, 1],
                    transition: { delay: 0.1 },
                  }}
                  initial={{ pathLength: 1, opacity: 1 }}
                  exit={{ pathLength: 1, opacity: 1 }}
                />
                <motion.line
                  x1="16"
                  x2="22"
                  y1="9"
                  y2="15"
                  animate={{
                    pathLength: [0, 1],
                    opacity: [0, 1],
                    transition: { delay: 0.2 },
                  }}
                  initial={{ pathLength: 1, opacity: 1 }}
                  exit={{ pathLength: 1, opacity: 1 }}
                />
              </Fragment>
            )}
          </AnimatePresence>
        </svg>
      </div>
    );
  }
);

VolumeIcon.displayName = 'VolumeIcon';

export { VolumeIcon };
