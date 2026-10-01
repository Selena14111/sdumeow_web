import type { ReactNode } from 'react'

import { Card } from 'antd'

type Action = {
  key: string
  icon?: ReactNode
  title: string
  description: string
  onClick?: () => void
}

type QuickActionsProps = {
  actions: Action[]
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map((action) => (
        <Card
          key={action.key}
          className="cursor-pointer rounded-3xl"
          hoverable
          onClick={action.onClick}
        >
          <div className="text-sm font-semibold text-slate-900">{action.title}</div>
          <div className="mt-1 text-xs text-slate-500">{action.description}</div>
        </Card>
      ))}
    </div>
  )
}
