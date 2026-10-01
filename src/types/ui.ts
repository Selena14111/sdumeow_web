import type { ReactNode } from 'react'

export type NavItem = {
  key: string
  label: string
  to: string
  icon?: ReactNode
}

export type Option = {
  label: string
  value: string
}
