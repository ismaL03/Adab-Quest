import { motion, type HTMLMotionProps } from 'motion/react';
import { forwardRef } from 'react';
import { cn } from '@/lib/cn';
import { sfx } from '@/audio/sfx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'gold' | 'success' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  children?: React.ReactNode;
  silent?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-primary text-on-primary shadow-[0_1px_0_rgb(255_255_255/0.25)_inset,0_10px_24px_-10px_var(--primary)] hover:brightness-110',
  secondary: 'glass text-ink hover:bg-surface-strong',
  ghost: 'text-ink-soft hover:bg-surface-sunken hover:text-ink',
  gold: 'bg-gradient-to-b from-gold-bright to-gold text-[#1d1608] shadow-[0_1px_0_rgb(255_255_255/0.4)_inset,0_10px_24px_-10px_var(--gold)] hover:brightness-105',
  success: 'bg-success text-white shadow-[0_10px_24px_-10px_var(--success)] hover:brightness-110',
  danger: 'bg-danger text-white shadow-[0_10px_24px_-10px_var(--danger)] hover:brightness-110',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm rounded-xl gap-1.5',
  md: 'h-11 px-5 text-[0.95rem] rounded-2xl gap-2',
  lg: 'h-14 px-7 text-base rounded-2xl gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', block, className, children, silent, onClick, disabled, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      whileHover={disabled ? undefined : { y: -1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        'relative inline-flex select-none items-center justify-center font-semibold tracking-[-0.01em] transition-[filter,background-color,color,opacity] duration-200',
        'disabled:opacity-40 disabled:saturate-50',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
      disabled={disabled}
      onClick={(e) => {
        if (!silent) sfx.tap();
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </motion.button>
  );
});
