import type { ComponentType } from 'react'
import { createHashRouter } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { RouteError, RouteLoading } from '@/components/layout/RouteError'

const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({
  Component: (await load()).default,
})

/** Hash routing: GitHub Pages has no server rewrites, so deep links must not depend on them. */
export const router = createHashRouter([
  {
    index: true,
    HydrateFallback: RouteLoading,
    errorElement: <RouteError />,
    lazy: page(() => import('@/pages/LandingPage')),
  },
  {
    Component: AppShell,
    HydrateFallback: RouteLoading,
    children: [
      {
        errorElement: <RouteError />,
        children: [
          { path: 'przeglad', lazy: page(() => import('@/pages/OverviewPage')) },
          { path: 'przejazdy', lazy: page(() => import('@/pages/CrossingsPage')) },
          { path: 'przejazdy/:id', lazy: page(() => import('@/pages/CrossingDetailPage')) },
          { path: 'srodki', lazy: page(() => import('@/pages/CountermeasuresPage')) },
          { path: 'wdrozenia', lazy: page(() => import('@/pages/TrackingPage')) },
          { path: 'ocena', lazy: page(() => import('@/pages/EvaluationPage')) },
          { path: 'metoda', lazy: page(() => import('@/pages/MethodPage')) },
          {
            path: '*',
            loader: () => {
              throw new Response('', { status: 404 })
            },
          },
        ],
      },
    ],
  },
])
