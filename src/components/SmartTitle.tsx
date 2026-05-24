import { cn } from '@/lib/utils';

interface SmartTitleProps {
  title: string;
  logoUrl?: string;
  className?: string;
  isDark?: boolean;
  height?: string;
  // Nuevos parámetros de color
  logoColor?: string;
  lineColor?: string;
  textColor?: string;
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

  const containerStyle = {
    '--title-height': height,
    height: 'var(--title-height)',
    gap: 'calc(var(--title-height) * 0.12)'
  } as React.CSSProperties;

  return (
    <div 
      className={cn("flex items-stretch w-max select-none", className)}
      style={containerStyle}
    >
      {/* 1. LOGO */}
      {logoUrl && (
        <div 
          className={cn(
            "aspect-square shrink-0 transition-colors duration-300",
            !logoColor && (isDark ? "bg-primary" : "bg-primary-foreground")
          )}
          style={{
            backgroundColor: logoColor,
            maskImage: `url(${logoUrl})`,
            WebkitMaskImage: `url(${logoUrl})`,
            maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center', WebkitMaskPosition: 'center',
            maskSize: 'contain', WebkitMaskSize: 'contain',
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