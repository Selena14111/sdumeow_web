import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import { RouterProvider } from 'react-router-dom'

import { router } from '@/router'
import { antdTheme } from '@/styles/antd-theme'

import 'antd/dist/reset.css'
import '@/styles/tailwind.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 15_000,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider theme={antdTheme}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ConfigProvider>
  </StrictMode>,
)
