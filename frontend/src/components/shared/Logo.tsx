'use client';

/**
 * Logo Component
 * Displays the Legal Evidence Hub branding
 */

import Link from 'next/link';
import { Scale } from 'lucide-react';

interface LogoProps {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: {
    icon: 'w-6 h-6',
    text: 'text-sm',
    container: 'gap-2',
  },
  md: {
    icon: 'w-8 h-8',
    text: 'text-lg',
    container: 'gap-2',
  },
  lg: {
    icon: 'w-10 h-10',
    text: 'text-xl',
    container: 'gap-3',
  },
};

export function Logo({
  href = '/dashboard',
  size = 'md',
  showText = true,
  className = '',
}: LogoProps) {
  const styles = sizeStyles[size];

  const content = (
    <div className={`flex items-center ${styles.container} ${className}`}>
      <div className="p-2 bg-accent/10 rounded-lg">
        <Scale className={`${styles.icon} text-accent`} />
      </div>
      {showText && (
        <span className={`font-bold text-secondary ${styles.text}`}>
          Legal Evidence Hub
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="hover:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}

export default Logo;
