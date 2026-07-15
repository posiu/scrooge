interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showWordmark?: boolean;
  /** 'inverted' = soft translucent badge for use on dark/colored surfaces (e.g. sidebar) */
  variant?: 'default' | 'inverted';
}

export function Logo({
  className = '',
  iconClassName = 'w-8 h-8',
  textClassName = 'text-xl font-bold tracking-tight text-foreground',
  showWordmark = true,
  variant = 'default',
}: LogoProps) {
  const inverted = variant === 'inverted';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className={iconClassName} aria-hidden="true">
        {inverted ? (
          <rect width="32" height="32" rx="9" fill="white" fillOpacity="0.12" />
        ) : (
          <>
            <defs>
              <linearGradient id="scrooge-logo-grad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0f8a38" />
                <stop offset="100%" stopColor="#01581E" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="9" fill="url(#scrooge-logo-grad)" />
          </>
        )}
        <path
          d="M21.5 12.1c-.3-2.1-2.7-3.4-5.4-3.4-2.9 0-5.4 1.4-5.4 3.3 0 4.6 11.2 2.5 11.2 7.9 0 2-2.5 3.5-5.4 3.5-2.8 0-5.2-1.3-5.5-3.4"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {showWordmark && <span className={textClassName}>Scrooge</span>}
    </div>
  );
}
