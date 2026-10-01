import type { ReactNode } from 'react'

import { Card } from 'antd'

import { PageContainer } from '@/components/common/PageContainer'

type RouteScaffoldProps = {
  title: string
  subtitle?: string
  right?: ReactNode
  children?: ReactNode
}

export function RouteScaffold({ title, subtitle, right, children }: RouteScaffoldProps) {
  return (
    <PageContainer action={right} subtitle={subtitle} title={title}>
      {children ?? <Card>No content</Card>}
    </PageContainer>
  )
}
