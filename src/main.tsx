import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/router'
import { ThemeWatcher } from '@/app/ThemeWatcher'
import { MotionProvider } from '@/app/MotionProvider'
import { ToastProvider } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeWatcher />
      <MotionProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </MotionProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
