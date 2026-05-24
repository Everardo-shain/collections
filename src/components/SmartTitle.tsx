import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface SmartTitleProps {
  title: string;
  logoUrl?: string;
  className?: string;
  isDark?: boolean;
  height?: string;
  logoColor?: string;
  lineColor?: string;
  textColor?: string;
}

function resolveClamp(value: string): string {
  const clampMatch = value.match(/^clamp\(\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/);
  if (!clampMatch) return value;

  const [, minStr, preferredStr, maxStr] = clampMatch;

  const parseRem = (v: string) => parseFloat(v) * 16;
  const parseVw = (v: string) => (parseFloat(v) / 100) * window.innerWidth;
  const parsePx = (v: string) => parseFloat(v);

  const parse = (v: string): number => {
    v = v.trim();
    if (v.endsWith('rem')) return parseRem(v);
    if (v.endsWith('vw')) return parseVw(v);
    if (v.endsWith('px')) return parsePx(v);
    return parseFloat(v);
  };

  const min = parse(minStr);
  const preferred = parse(preferredStr);
  const max = parse(maxStr);
  const resolved = Math.min(Math.max(preferred, min), max);
  return `${resolved}px`;
}

export function SmartTitle({ 
  title, 
  logoUrl, 
  className, 
  isDark = false,
  height = "2.5rem",
  logoColor,
  lineColor,
  textColor
}: SmartTitleProps) {
  const words = title.split(' ');
  const firstWord = words.length >= 2 ? words[0] : '';
  const restOfTitle = words.length >= 2 ? words.slice(1).join(' ') : title;

  const [resolvedHeight, setResolvedHeight] = useState(() => resolveClamp(height));

  useEffect(() => {
    const update = () => setResolvedHeight(resolveClamp(height));
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [height]);

  const containerStyle = {
    '--title-height': resolvedHeight,
    height: resolvedHeight,
    gap: `calc(${resolvedHeight} * 0.12)`
  } as React.CSSProperties;

  return (
    <div 
      className={cn("flex items-stretch w-max select-none", className)}
      style={containerStyle}
    >
      {/* 1. LOGO */}
      {logoUrl && (
        <img
          src={logoUrl}
          style={{
            height: resolvedHeight,
            width: resolvedHeight,
            objectFit: 'contain',
            filter: logoColor ? `drop-shadow(0 0 0 ${logoColor})` : undefined,
          }}
        />
      )}
      {/* 2. LÍNEA DIVISORA */}
      <div 
        className={cn("shrink-0", !lineColor && (isDark ? "bg-foreground" : "bg-primary-foreground"))} 
        style={{ 
          backgroundColor: lineColor,
          width: `calc(var(--title-height) * 0.055)`,
          minWidth: '1px'
        }}
      />

      {/* 3. TÍTULO */}
      <div className={cn(
        "flex flex-col justify-center items-start uppercase whitespace-nowrap w-max text-left",
        !textColor && (isDark ? "text-foreground" : "text-primary-foreground")
      )}
      style={{ 
        color: textColor,
        gap: `calc(var(--title-height) * -0.06)` 
      }}>
        {firstWord && (
          <span 
            className="font-medium tracking-[0.25em] opacity-80"
            style={{ 
              fontSize: `calc(var(--title-height) * 0.38)`, 
              lineHeight: '0.9',
              display: 'block',
              transform: 'translateY(-0.08em)'
            }}
          >
            {firstWord}
          </span>
        )}
        <span 
          className="font-black tracking-tighter"
          style={{ 
            fontSize: `calc(var(--title-height) * 0.72)`,
            lineHeight: '0.9',
            display: 'block',
            marginLeft: '-0.025em', 
            transform: 'translateY(0.08em)'
          }}
        >
          {restOfTitle}
        </span>
      </div>
    </div>
  );
}