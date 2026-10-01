import type { ReactNode } from 'react'

import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'

type PageHeaderProps = {
  title: string
  right?: ReactNode
  withBack?: boolean
}

export function PageHeader({ title, right, withBack = true }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {withBack ? (
          <Button
            aria-label="Back"
            className="!h-9 !w-9"
            icon={<ArrowLeftOutlined />}
            shape="circle"
            type="default"
            onClick={() => navigate(-1)}
          />
        ) : null}
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      </div>
      {right}
    </div>
  )
}
