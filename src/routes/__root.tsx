import {
  createRootRoute, HeadContent, Scripts, ScrollRestoration, redirect,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { getCookie } from '@tanstack/react-start/server'

import { migrate } from '~/lib/db/migrate'
import { verifySession } from '~/lib/auth'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#f5a623' },
      { title: 'ADHD Focus' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'manifest', href: '/manifest.json' },
      { rel: 'icon', href: '/icons/icon-192.png' },
    ],
  }),

  beforeLoad: async ({ location }) => {
    await migrate()

    if (location.pathname === '/login') return

    const token = getCookie('session')
    if (!token || !(await verifySession(token))) {
      throw redirect({ to: '/login' })
    }
  },

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            { name: 'Tanstack Router', render: <TanStackRouterDevtoolsPanel /> },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
