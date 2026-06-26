import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/router'
import { ThemeWatcher } from '@/app/ThemeWatcher'
import { MotionProvider } from '@/app/MotionProvider'
import { ToastProvider } from '@/components/ui/Toast'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeWatcher />
    <MotionProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </MotionProvider>
  </React.StrictMode>,
)
