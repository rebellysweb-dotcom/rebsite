import type { ReactNode, SVGProps } from 'react';
import styles from './Icon.module.css';

/**
 * In-house florist's icon set. 24px grid, 1.5px stroke, round caps and joins,
 * currentColor only. Slightly organic curves; leaves and petals appear as small
 * botanical touches. Drawn for this shop, not taken from any pack.
 */
export type IconName =
  | 'bag' | 'close' | 'trash' | 'plus' | 'minus'
  | 'arrow-right' | 'arrow-left' | 'card' | 'balloon' | 'gift'
  | 'phone' | 'whatsapp' | 'pin' | 'clock' | 'truck' | 'mail'
  | 'check' | 'chevron-down' | 'menu' | 'search'
  | 'christmas' | 'newborn' | 'bouquet' | 'events'
  | 'dashboard' | 'orders' | 'products' | 'calendar' | 'settings'
  | 'sign-out' | 'eye' | 'eye-off';

const PATHS: Record<IconName, ReactNode> = {
  /* shopping bag with a small leaf on the handle */
  bag: (
    <>
      <path d="M5.2 8.4c.1-.5.5-.9 1-.9h11.6c.5 0 .9.4 1 .9l.9 10.2c.1.9-.6 1.6-1.5 1.6H5.8c-.9 0-1.6-.7-1.5-1.6l.9-10.2Z" />
      <path d="M8.6 7.5V7a3.4 3.4 0 0 1 6.8 0v.5" />
      <path d="M12 12.6c.2-1.2 1.2-1.9 2.4-1.8-.1 1.2-1 2-2.4 1.8Z" />
    </>
  ),
  close: (
    <>
      <path d="M6.2 6.2c3.9 3.8 7.7 7.6 11.6 11.6" />
      <path d="M17.8 6.2C13.9 10 10.1 13.8 6.2 17.8" />
    </>
  ),
  /* bin with a lid and a falling petal */
  trash: (
    <>
      <path d="M4.5 6.8h15" />
      <path d="M9.4 6.8V5.4c0-.6.5-1.1 1.1-1.1h3c.6 0 1.1.5 1.1 1.1v1.4" />
      <path d="M6.3 6.8l.8 11.6c.1.9.8 1.5 1.6 1.5h6.6c.8 0 1.5-.6 1.6-1.5l.8-11.6" />
      <path d="M12 11c1.3.3 1.8 1.3 1.6 2.5-1.3-.2-1.9-1.2-1.6-2.5Z" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5.4c.1 4.4.1 8.8 0 13.2" />
      <path d="M5.4 12c4.4-.1 8.8-.1 13.2 0" />
    </>
  ),
  minus: <path d="M5.4 12c4.4-.1 8.8-.1 13.2 0" />,
  'arrow-right': (
    <>
      <path d="M4.5 12.2c4.9-.3 10-.3 14.8-.1" />
      <path d="M14 6.8c1.6 2.1 3.4 3.7 5.4 5.3-2 1.6-3.8 3.3-5.4 5.4" />
    </>
  ),
  'arrow-left': (
    <>
      <path d="M19.5 12.2c-4.9-.3-10-.3-14.8-.1" />
      <path d="M10 6.8C8.4 8.9 6.6 10.5 4.6 12.1c2 1.6 3.8 3.3 5.4 5.4" />
    </>
  ),
  /* greeting card: folded card with a heart-leaf */
  card: (
    <>
      <path d="M5.6 5.4h12.8c.8 0 1.4.6 1.4 1.4v10.4c0 .8-.6 1.4-1.4 1.4H5.6c-.8 0-1.4-.6-1.4-1.4V6.8c0-.8.6-1.4 1.4-1.4Z" />
      <path d="M4.4 7.4l6.9 5.1c.4.3 1 .3 1.4 0l6.9-5.1" />
      <path d="M12 17.2c-1.7-1-2.7-2-2.7-3.1 0-1 .8-1.6 1.6-1.4" />
    </>
  ),
  /* balloon with string and a tie leaf */
  balloon: (
    <>
      <path d="M12 3.4c3.3 0 5.6 2.5 5.6 5.7 0 3.6-2.9 6.2-5.6 7.2-2.7-1-5.6-3.6-5.6-7.2 0-3.2 2.3-5.7 5.6-5.7Z" />
      <path d="M10.7 16.5l1.3 1.5 1.3-1.5" />
      <path d="M12 18c-.8 1.2.9 1.9 0 3.1" />
      <path d="M9.4 7.6c.3-1 1-1.7 2-2" />
    </>
  ),
  /* gift box with a bow of two petals */
  gift: (
    <>
      <path d="M4.5 10.2h15v3.2h-15z" />
      <path d="M5.8 13.4v5.1c0 .8.6 1.4 1.4 1.4h9.6c.8 0 1.4-.6 1.4-1.4v-5.1" />
      <path d="M12 10.2v9.7" />
      <path d="M12 10.2C9.8 10.3 8 9.4 8 7.9c0-1.2.9-1.9 1.9-1.8C11.1 6.2 11.9 8 12 10.2Z" />
      <path d="M12 10.2c2.2.1 4-.8 4-2.3 0-1.2-.9-1.9-1.9-1.8-1.2.1-2 1.9-2.1 4.1Z" />
    </>
  ),
  phone: (
    <path d="M6.4 4.2c.5-.5 1.3-.5 1.8 0l1.9 2.3c.4.5.4 1.2 0 1.6l-1 1c.9 1.9 2.4 3.4 4.4 4.4l1-1c.4-.4 1.1-.4 1.6 0l2.3 1.9c.5.4.5 1.3 0 1.8l-1 1c-.9.9-2.2 1.2-3.4.8-5-1.7-8.3-5-10-10-.4-1.2-.1-2.5.8-3.4l.6-.4Z" />
  ),
  /* speech bubble with a handset and a tail */
  whatsapp: (
    <>
      <path d="M12 3.6a8.4 8.4 0 0 0-7.2 12.7L3.7 20.3l4.1-1.1A8.4 8.4 0 1 0 12 3.6Z" />
      <path d="M9.2 8.4c.3-.3.8-.3 1 .1l.7 1.5c.1.3 0 .6-.2.8l-.5.5c.6 1.1 1.4 1.9 2.5 2.5l.5-.5c.2-.2.5-.3.8-.2l1.5.7c.4.2.4.7.1 1-.6.7-1.5.9-2.4.6-2.2-.8-3.7-2.3-4.5-4.5-.3-.9 0-1.7.5-2.5Z" />
    </>
  ),
  /* pin with a leaf inside */
  pin: (
    <>
      <path d="M12 20.6c-3.6-3.7-6.1-6.7-6.1-10A6.1 6.1 0 0 1 12 4.4a6.1 6.1 0 0 1 6.1 6.2c0 3.3-2.5 6.3-6.1 10Z" />
      <path d="M12 12.8c-1.6-.3-2.4-1.4-2.2-2.9 1.6.1 2.5 1.2 2.2 2.9Z" />
      <path d="M12 12.8c.1-1.5 1-2.4 2.4-2.5.1 1.4-.8 2.4-2.4 2.5Z" />
    </>
  ),
  /* envelope with a small leaf on the flap */
  mail: (
    <>
      <path d="M4.6 6.6c0-.6.5-1.1 1.1-1.1h12.6c.6 0 1.1.5 1.1 1.1v10.8c0 .6-.5 1.1-1.1 1.1H5.7c-.6 0-1.1-.5-1.1-1.1V6.6Z" />
      <path d="M4.8 7.2c2.2 2.2 4.3 3.9 7.2 5.2 2.9-1.3 5-3 7.2-5.2" />
      <path d="M12 12.4c-.2-1.3.5-2.2 1.8-2.4.2 1.3-.5 2.3-1.8 2.4Z" />
    </>
  ),
  clock: (
    <>
      <path d="M12 3.8a8.2 8.2 0 1 1-.1 0Z" />
      <path d="M12 7.6V12l3 1.9" />
    </>
  ),
  /* delivery van carrying a sprig */
  truck: (
    <>
      <path d="M3.4 7.6c0-.6.5-1.1 1.1-1.1h8.3c.6 0 1.1.5 1.1 1.1v9.2H3.4V7.6Z" />
      <path d="M13.9 10h3.3l2.9 3v3.8h-6.2V10Z" />
      <circle cx="7.6" cy="17.6" r="1.8" />
      <circle cx="16.6" cy="17.6" r="1.8" />
      <path d="M6.6 12.2c.3-1.5 1.4-2.3 2.9-2.2-.1 1.5-1.2 2.4-2.9 2.2Z" />
    </>
  ),
  check: <path d="M5.2 12.7c1.6 1.2 2.9 2.5 4 4.1 2.4-4.1 5.3-7.2 9.5-9.7" />,
  'chevron-down': <path d="M6 9.4c2.1 1.9 4.1 3.8 6 5.9 1.9-2.1 3.9-4 6-5.9" />,
  menu: (
    <>
      <path d="M4.5 8c4.9-.4 10.1-.4 15 0" />
      <path d="M4.5 16c4.9.4 10.1.4 15 0" />
    </>
  ),
  /* magnifier whose handle ends in a leaf */
  search: (
    <>
      <path d="M10.8 4.4a6.4 6.4 0 1 1-.1 0Z" />
      <path d="M15.6 15.6l3.3 3.3" />
      <path d="M18.9 18.9c.9-.2 1.5-.9 1.6-1.9-1 0-1.7.7-1.6 1.9Z" />
    </>
  ),
  /* pine sprig */
  christmas: (
    <>
      <path d="M12 3.6v16.8" />
      <path d="M12 6.6c-1.2 1.2-2.5 2-4 2.4" />
      <path d="M12 6.6c1.2 1.2 2.5 2 4 2.4" />
      <path d="M12 11c-1.7 1.4-3.5 2.3-5.6 2.7" />
      <path d="M12 11c1.7 1.4 3.5 2.3 5.6 2.7" />
      <path d="M12 15.4c-2 1.5-4 2.4-6.4 2.8" />
      <path d="M12 15.4c2 1.5 4 2.4 6.4 2.8" />
    </>
  ),
  /* small bloom: five petals round a centre */
  newborn: (
    <>
      <circle cx="12" cy="12" r="1.7" />
      <path d="M12 10.3C10.4 8.8 10.4 6 12 4.4c1.6 1.6 1.6 4.4 0 5.9Z" />
      <path d="M13.6 11.2c.4-2.1 2.6-3.7 5-3.5.2 2.3-1.3 4.5-3.6 4.4" />
      <path d="M13.1 13.5c1.6 1.5 1.6 4.3 0 5.9-1.6-1.5-1.6-4.3 0-5.9Z" />
      <path d="M10.9 13.5c-1.6 1.5-1.6 4.3 0 5.9" />
      <path d="M10.4 11.2c-.4-2.1-2.6-3.7-5-3.5-.2 2.3 1.3 4.5 3.6 4.4" />
    </>
  ),
  /* wrapped bouquet: blooms over a cone */
  bouquet: (
    <>
      <path d="M12 12.4l-3.6 8h7.2l-3.6-8Z" />
      <path d="M9.8 16.6h4.4" />
      <path d="M12 12.4V10" />
      <circle cx="12" cy="6.6" r="2.6" />
      <circle cx="7.4" cy="9.4" r="2.1" />
      <circle cx="16.6" cy="9.4" r="2.1" />
    </>
  ),
  /* wedding arch with a hanging bloom */
  events: (
    <>
      <path d="M5.6 20.4V11a6.4 6.4 0 0 1 12.8 0v9.4" />
      <path d="M3.8 20.4h16.4" />
      <path d="M12 8.6c-1.1.9-1.1 2.3 0 3.2 1.1-.9 1.1-2.3 0-3.2Z" />
      <path d="M12 12v3.2" />
      <path d="M12 14.2c1.3-.4 2-1.3 2-2.5" />
    </>
  ),
  dashboard: (
    <>
      <path d="M4.4 5.6c0-.7.5-1.2 1.2-1.2h4.2c.7 0 1.2.5 1.2 1.2v4.2c0 .7-.5 1.2-1.2 1.2H5.6c-.7 0-1.2-.5-1.2-1.2V5.6Z" />
      <path d="M13 5.6c0-.7.5-1.2 1.2-1.2h4.2c.7 0 1.2.5 1.2 1.2v2.6c0 .7-.5 1.2-1.2 1.2h-4.2c-.7 0-1.2-.5-1.2-1.2V5.6Z" />
      <path d="M13 14.2c0-.7.5-1.2 1.2-1.2h4.2c.7 0 1.2.5 1.2 1.2v4.2c0 .7-.5 1.2-1.2 1.2h-4.2c-.7 0-1.2-.5-1.2-1.2v-4.2Z" />
      <path d="M4.4 15.8c0-.7.5-1.2 1.2-1.2h4.2c.7 0 1.2.5 1.2 1.2v2.6c0 .7-.5 1.2-1.2 1.2H5.6c-.7 0-1.2-.5-1.2-1.2v-2.6Z" />
    </>
  ),
  /* order slip with a tick */
  orders: (
    <>
      <path d="M6.6 3.8h10.8c.8 0 1.4.6 1.4 1.4v14.4l-2.2-1.3-2.2 1.3-2.2-1.3-2.2 1.3-2.2-1.3-1.4.8V5.2c0-.8.6-1.4 1.4-1.4Z" />
      <path d="M8.8 9.2h6.4" />
      <path d="M8.8 12.6h3.4" />
    </>
  ),
  /* a potted stem */
  products: (
    <>
      <path d="M7.4 14.6h9.2l-1 5.1c-.1.5-.5.8-1 .8h-5.2c-.5 0-.9-.3-1-.8l-1-5.1Z" />
      <path d="M12 14.6V8" />
      <path d="M12 10.6c-.2-2.3-1.6-3.7-4-3.9.1 2.4 1.6 3.8 4 3.9Z" />
      <path d="M12 8c.2-2.4 1.7-3.8 4.2-3.9-.1 2.5-1.7 3.9-4.2 3.9Z" />
    </>
  ),
  calendar: (
    <>
      <path d="M6 5.8h12c.8 0 1.4.6 1.4 1.4v11.2c0 .8-.6 1.4-1.4 1.4H6c-.8 0-1.4-.6-1.4-1.4V7.2c0-.8.6-1.4 1.4-1.4Z" />
      <path d="M4.6 10.2h14.8" />
      <path d="M8.4 3.8v3.4" />
      <path d="M15.6 3.8v3.4" />
      <path d="M12 17c-1.5-.9-2.3-1.7-2.3-2.6 0-.8.7-1.3 1.4-1.1.4.1.7.3.9.7.2-.4.5-.6.9-.7.7-.2 1.4.3 1.4 1.1 0 .9-.8 1.7-2.3 2.6Z" />
    </>
  ),
  /* sliders with leaf knobs */
  settings: (
    <>
      <path d="M4.5 8h15" />
      <path d="M4.5 16h15" />
      <path d="M9.4 5.4c1.5.4 2.2 1.5 2 2.8-1.5-.2-2.2-1.3-2-2.8Z" />
      <path d="M14.6 13.4c1.5.4 2.2 1.5 2 2.8-1.5-.2-2.2-1.3-2-2.8Z" />
    </>
  ),
  'sign-out': (
    <>
      <path d="M10.4 4.6H6.2c-.9 0-1.6.7-1.6 1.6v11.6c0 .9.7 1.6 1.6 1.6h4.2" />
      <path d="M9.6 12.1c3.4-.2 7-.2 10.4 0" />
      <path d="M16.4 8.4c1.2 1.3 2.4 2.5 3.6 3.7-1.2 1.2-2.4 2.4-3.6 3.7" />
    </>
  ),
  eye: (
    <>
      <path d="M2.8 12c2.3-4 5.5-6 9.2-6s6.9 2 9.2 6c-2.3 4-5.5 6-9.2 6s-6.9-2-9.2-6Z" />
      <circle cx="12" cy="12" r="2.7" />
    </>
  ),
  'eye-off': (
    <>
      <path d="M9.6 6.3c.8-.2 1.5-.3 2.4-.3 3.7 0 6.9 2 9.2 6-.7 1.2-1.5 2.2-2.4 3" />
      <path d="M6.2 8.2C4.8 9.3 3.7 10.6 2.8 12c2.3 4 5.5 6 9.2 6 1.1 0 2.1-.2 3.1-.5" />
      <path d="M10 10.2a2.7 2.7 0 0 0 3.8 3.6" />
      <path d="M4.6 4.6c4.9 5 9.9 9.9 14.8 14.8" />
    </>
  ),
};

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name' | 'children'> {
  name: IconName;
  /** px. Contexts: 18 in buttons, 22 in tiles, 16 in dense admin rows. */
  size?: number;
  /** Optional hover/press behaviour driven by the nearest interactive parent. */
  motion?: 'nudge' | 'nudge-back' | 'lift' | 'none';
}

export default function Icon({ name, size = 18, motion = 'none', className, ...rest }: IconProps) {
  const cls = [styles.icon, motion !== 'none' ? styles[motion === 'nudge-back' ? 'nudgeBack' : motion] : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cls}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
