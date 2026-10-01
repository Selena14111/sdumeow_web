import type { ReactNode } from 'react'

import { Alert, Empty, Skeleton } from 'antd'

type QueryStateProps = {
  isLoading?: boolean
  error?: unknown
  isEmpty?: boolean
  emptyDescription?: string
  children: ReactNode
}

export function QueryState({
  isLoading,
  error,
  isEmpty,
  emptyDescription = '暂无数据',
  children,
}: QueryStateProps) {
  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 3 }} />
  }

  if (error) {
    const message = error instanceof Error ? error.message : '请求失败，请稍后重试'
    return <Alert message="加载失败" description={message} showIcon type="error" />
  }

  if (isEmpty) {
    return <Empty description={emptyDescription} image={Empty.PRESENTED_IMAGE_SIMPLE} />
  }

  return <>{children}</>
}
