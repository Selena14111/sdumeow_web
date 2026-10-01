import type { NavItem } from '@/types/ui'

import clsx from 'clsx'
import { Link, useLocation } from 'react-router-dom'

type BottomNavProps = {
  items: NavItem[]
  variant?: 'user' | 'admin'
}

export function BottomNav({ items, variant = 'user' }: BottomNavProps) {
  const location = useLocation()

  return (
    <nav className="fixed bottom-5 left-1/2 z-30 w-[min(350px,calc(100%-34px))] -translate-x-1/2 rounded-[36px] bg-white/95 px-3 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.14)] backdrop-blur">
      <ul className="flex items-center justify-between gap-2">
        {items.map((item) => {
          const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
          return (
            <li key={item.key}>
              <Link
                className={clsx(
                  'flex h-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-medium transition-all',
                  active
                    ? variant === 'admin'
                      ? 'min-w-[88px] bg-[#ffd54f] text-[#5d4037]'
                      : 'min-w-[88px] bg-[#1a1a1a] text-white'
                    : 'w-11 text-[#c0c0c0] hover:bg-slate-100 hover:text-slate-600',
                )}
                to={item.to}
              >
                <span className="text-[18px] leading-none">{item.icon ?? item.label.slice(0, 1)}</span>
                {active ? <span className="text-[13px]">{item.label}</span> : null}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
