// Єдиний набір лінійних іконок — той самий візуальний стиль, що й у
// мобільному застосунку та адмінці (контур 1.75, заокруглені кінці,
// viewBox 24×24). Заміна всіх emoji на маркетплейсі. Додавати нові
// іконки сюди, а не розсипати emoji знову.
export type IconName =
  | 'close'
  | 'checkCircle'
  | 'coffeeCup'
  | 'pin'
  | 'camera'
  | 'wallet'
  | 'eye'
  | 'message'
  | 'truck'
  | 'phone'
  | 'edit'
  | 'heart'
  | 'star'
  | 'inbox'
  | 'menu'
  | 'send'
  | 'clock'
  | 'home'
  | 'grinder'
  | 'bean'
  | 'toolbox'
  | 'package';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  filled?: boolean;
  className?: string;
}

export function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, filled = false, className }: IconProps) {
  const p = { stroke: color, strokeWidth, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const pf = filled ? { ...p, fill: color } : p;

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      {renderIcon(name, p, color, pf)}
    </svg>
  );
}

function renderIcon(name: IconName, p: any, color: string, pf: any) {
  switch (name) {
    case 'close':
      return (
        <>
          <line x1="6" y1="6" x2="18" y2="18" {...p} />
          <line x1="18" y1="6" x2="6" y2="18" {...p} />
        </>
      );
    case 'checkCircle':
      return (
        <>
          <circle cx="12" cy="12" r="9" {...p} />
          <path d="M8 12l3 3 5-6" {...p} />
        </>
      );
    case 'coffeeCup':
      return (
        <>
          <path d="M5 9h11v6a4 4 0 01-4 4H9a4 4 0 01-4-4V9z" {...p} />
          <path d="M16 10h2a2 2 0 010 4h-2" {...p} />
          <line x1="7" y1="5" x2="7" y2="7" {...p} />
          <line x1="10" y1="4" x2="10" y2="7" {...p} />
        </>
      );
    case 'pin':
      return (
        <>
          <path d="M12 21s7-7.58 7-12a7 7 0 10-14 0c0 4.42 7 12 7 12z" {...p} />
          <circle cx="12" cy="9" r="2.5" {...p} />
        </>
      );
    case 'camera':
      return (
        <>
          <path d="M4 8.5a1.5 1.5 0 011.5-1.5h2l1-2h7l1 2h2a1.5 1.5 0 011.5 1.5v9A1.5 1.5 0 0118.5 19h-13A1.5 1.5 0 014 17.5v-9z" {...p} />
          <circle cx="12" cy="13" r="3.3" {...p} />
        </>
      );
    case 'wallet':
      return (
        <>
          <path d="M4 7.5A2.5 2.5 0 016.5 5H18a1 1 0 011 1v2" {...p} />
          <rect x="3" y="7.5" width="18" height="12" rx="2.5" {...p} />
          <circle cx="15.5" cy="13" r="1.3" fill={color} stroke="none" />
        </>
      );
    case 'eye':
      return (
        <>
          <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" {...p} />
          <circle cx="12" cy="12" r="3" {...p} />
        </>
      );
    case 'message':
      return <path d="M4 5h16v11H8l-4 4V5z" {...p} />;
    case 'truck':
      return (
        <>
          <path d="M3 7h10v9H3z" {...p} />
          <path d="M13 10h4l3 3v3h-7z" {...p} />
          <circle cx="7" cy="18" r="1.6" {...p} />
          <circle cx="17" cy="18" r="1.6" {...p} />
        </>
      );
    case 'phone':
      return <path d="M6.6 10.8a14 14 0 006.6 6.6l2.2-2.2a1.2 1.2 0 011.2-.3c1 .3 2 .5 3.1.5a1.2 1.2 0 011.3 1.2V20a1.2 1.2 0 01-1.3 1.3A17.3 17.3 0 013 4.3 1.2 1.2 0 014.3 3h3.4a1.2 1.2 0 011.2 1.3c0 1.1.2 2.1.5 3.1.1.4 0 .9-.3 1.2l-2.5 2.2z" {...p} />;
    case 'edit':
      return (
        <>
          <path d="M4 20l.9-4L16.5 4.4a1.5 1.5 0 012.1 0l1 1a1.5 1.5 0 010 2.1L8 19.1 4 20z" {...p} />
          <line x1="14.5" y1="6.5" x2="17.5" y2="9.5" {...p} />
        </>
      );
    case 'heart':
      return <path d="M12 20s-7-4.6-9.5-9A5.5 5.5 0 0112 5a5.5 5.5 0 019.5 6c-2.5 4.4-9.5 9-9.5 9z" {...pf} />;
    case 'star':
      return <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8L12 3.5z" {...pf} />;
    case 'inbox':
      return (
        <>
          <path d="M3.5 12.5h5l1.5 2.5h4l1.5-2.5h5" {...p} />
          <path d="M5 5.5h14l1.5 7v5a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 17.5v-5l1.5-7z" {...p} />
        </>
      );
    case 'menu':
      return (
        <>
          <line x1="4" y1="6" x2="20" y2="6" {...p} />
          <line x1="4" y1="12" x2="20" y2="12" {...p} />
          <line x1="4" y1="18" x2="20" y2="18" {...p} />
        </>
      );
    case 'send':
      return <path d="M4 11.5L20.5 4 13 20.5l-2.3-6.8L4 11.5z" {...p} />;
    case 'clock':
      return (
        <>
          <circle cx="12" cy="12" r="9" {...p} />
          <path d="M12 7v5l3.5 2" {...p} />
        </>
      );
    case 'home':
      return (
        <>
          <path d="M4 11l8-7 8 7" {...p} />
          <path d="M6 10v9a1 1 0 001 1h3v-6h4v6h3a1 1 0 001-1v-9" {...p} />
        </>
      );
    case 'grinder':
      return (
        <>
          <circle cx="12" cy="12" r="3.2" {...p} />
          <path d="M12 3v2.4M12 18.6V21M4.9 6.3l1.7 1.7M17.4 16l1.7 1.7M3 12h2.4M18.6 12H21M4.9 17.7l1.7-1.7M17.4 8l1.7-1.7" {...p} />
        </>
      );
    case 'bean':
      return (
        <>
          <ellipse cx="12" cy="12" rx="5.6" ry="8.6" transform="rotate(25 12 12)" {...p} />
          <path d="M12 4.6c-2.2 3.3-2.2 11.5 0 14.8" transform="rotate(25 12 12)" {...p} />
        </>
      );
    case 'toolbox':
      return (
        <>
          <rect x="3" y="9" width="18" height="10" rx="2" {...p} />
          <path d="M8 9V6.5a2 2 0 012-2h4a2 2 0 012 2V9" {...p} />
          <line x1="3" y1="13.5" x2="21" y2="13.5" {...p} />
        </>
      );
    case 'package':
      return (
        <>
          <path d="M3.5 8l8.5-4.5L20.5 8v8L12 20.5 3.5 16V8z" {...p} />
          <path d="M3.5 8L12 12.5 20.5 8M12 12.5V20.5" {...p} />
        </>
      );
    default:
      return null;
  }
}
