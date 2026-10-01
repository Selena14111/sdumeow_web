import type { PropsWithChildren, ReactNode } from 'react'

import clsx from 'clsx'

type PageContainerProps = PropsWithChildren<{
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}>

export function PageContainer({ title, subtitle, action, className, children }: PageContainerProps) {
  return (
    <div className={clsx('mx-auto w-full max-w-md px-4 pb-28 pt-5', className)}>
      <div className="mb-5 rounded-3xl bg-white p-4 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          {action}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}
