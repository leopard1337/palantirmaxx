import { type ReactNode } from 'react';

interface CardRootProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardRootProps) {
  const base =
    'rounded-lg border border-white/[0.08] bg-white/[0.03] flex flex-col text-left transition-colors duration-150 transition-lift hover:border-white/[0.14] hover:bg-white/[0.05] active:scale-[0.998] focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 focus:ring-offset-background focus-visible:ring-2';
  const cls = `${base} ${className ?? ''}`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${cls} cursor-pointer`}>
        {children}
      </button>
    );
  }
  return <div className={cls}>{children}</div>;
}

export function CardHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-3.5 pt-3 pb-2 shrink-0 ${className ?? ''}`}>
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-3.5 pb-3 flex-1 min-h-0 ${className ?? ''}`}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`px-3.5 pb-3 pt-2 mt-auto shrink-0 border-t border-white/[0.06] ${className ?? ''}`}
    >
      {children}
    </div>
  );
}
