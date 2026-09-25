interface IconProps {
  size?: number
}

function svg(path: React.ReactNode, size: number) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {path}
    </svg>
  )
}

export const IconUser = ({ size = 16 }: IconProps) => svg(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>, size)

export const IconStethoscope = ({ size = 16 }: IconProps) =>
  svg(<><path d="M4.8 3H3v5a5 5 0 0 0 10 0V3h-1.8" /><path d="M8 18a4 4 0 0 0 8 0v-2" /><circle cx="18" cy="13" r="2.5" /></>, size)

export const IconShield = ({ size = 16 }: IconProps) => svg(<path d="M12 3l7 3v5.5c0 4.3-2.9 8.2-7 9.5-4.1-1.3-7-5.2-7-9.5V6z" />, size)

export const IconLock = ({ size = 16 }: IconProps) => svg(<><rect x="4" y="10.5" width="16" height="10" rx="2.5" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /></>, size)

export const IconCheck = ({ size = 16 }: IconProps) => svg(<path d="M4.5 12.5l5 5 10-11" />, size)

export const IconSpark = ({ size = 16 }: IconProps) =>
  svg(<><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /><path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" /></>, size)

export const IconClock = ({ size = 16 }: IconProps) => svg(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>, size)

export const IconPulse = ({ size = 16 }: IconProps) => svg(<path d="M3 12h4l2.5-6 4 12 2.5-6H21" />, size)

export const IconGlobe = ({ size = 16 }: IconProps) =>
  svg(<><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.2 2.4 3.3 5.4 3.3 8.5S14.2 18.1 12 20.5c-2.2-2.4-3.3-5.4-3.3-8.5S9.8 5.9 12 3.5z" /></>, size)

export const IconSync = ({ size = 16 }: IconProps) =>
  svg(<><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.5" /><path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5" /><path d="M20 4.5v4h-4M4 19.5v-4h4" /></>, size)

export const IconDoc = ({ size = 16 }: IconProps) =>
  svg(<><path d="M6 3.5h7l5 5v12H6z" /><path d="M13 3.5v5h5" /><path d="M9 13h6M9 16.5h4" /></>, size)

export const IconMoon = ({ size = 16 }: IconProps) => svg(<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />, size)

export const IconEye = ({ size = 16 }: IconProps) => svg(<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>, size)

export const IconAlert = ({ size = 16 }: IconProps) => svg(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v5.5M12 16.2v.3" /></>, size)

export const IconArrow = ({ size = 16 }: IconProps) => svg(<><path d="M5 12h13" /><path d="M13 6.5l5.5 5.5L13 17.5" /></>, size)
