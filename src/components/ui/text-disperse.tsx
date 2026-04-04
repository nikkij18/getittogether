'use client';
import type { JSX, ComponentProps } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Transform {
	x: number;
	y: number;
	rotationZ: number;
}

// Larger scatter values so letters spread more dramatically
const transforms: Transform[] = [
	{ x: -2.2, y: -1.8, rotationZ: -34 },
	{ x: -0.6, y:  1.4, rotationZ:  18 },
	{ x:  1.8, y: -1.2, rotationZ: -22 },
	{ x: -1.4, y:  0.8, rotationZ:  12 },
	{ x:  0.5, y: -1.9, rotationZ: -15 },
	{ x:  2.0, y:  1.0, rotationZ:  28 },
	{ x: -0.9, y: -0.5, rotationZ: -10 },
	{ x:  1.2, y:  1.6, rotationZ:  20 },
	{ x: -1.8, y:  1.1, rotationZ: -26 },
	{ x:  0.4, y:  0.9, rotationZ:  14 },
	{ x: -0.3, y: -1.5, rotationZ: -8  },
	{ x:  1.5, y: -0.7, rotationZ:  22 },
	{ x: -2.0, y:  0.3, rotationZ: -18 },
];

type TextDisperseProps = ComponentProps<'div'> & {
	/** children should be a string */
	children: string;
	/** controlled from outside — true = scattered, false = together */
	scattered: boolean;
};

export function TextDisperse({
	children,
	scattered,
	className,
	...props
}: Omit<TextDisperseProps, 'onMouseEnter' | 'onMouseLeave'>) {

	const splitWord = (word: string) => {
		const chars: JSX.Element[] = [];
		word.split('').forEach((char, i) => {
			const t = transforms[i % transforms.length];
			const isSpace = char === ' ';
			chars.push(
				<motion.span
					key={char + i}
					style={{ display: 'inline-block', ...(isSpace ? { width: '0.28em' } : {}) }}
					animate={scattered ? 'scattered' : 'together'}
					variants={{
						scattered: {
							x: t.x + 'em',
							y: t.y + 'em',
							rotateZ: isSpace ? 0 : t.rotationZ,
							transition: { duration: 0.9, ease: [0.33, 1, 0.68, 1], delay: i * 0.03 },
						},
						together: {
							x: 0,
							y: 0,
							rotateZ: 0,
							transition: { duration: 0.75, ease: [0.33, 1, 0.68, 1], delay: i * 0.02 },
						},
					}}
				>
					{isSpace ? '\u00A0' : char}
				</motion.span>,
			);
		});
		return chars;
	};

	return (
		<div
			className={cn(
				"relative flex items-baseline cursor-pointer whitespace-nowrap",
				className,
			)}
			{...props}
		>
			{splitWord(children)}
		</div>
	);
}
