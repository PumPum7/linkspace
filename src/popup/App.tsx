import {
  AppProvider,
  Header,
  ModeView,
  Sidebar,
  WorkspaceView,
} from '@/components'
import { useAppState } from '@/hooks'

export function App() {
  const appState = useAppState()

  if (appState.isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <AppProvider value={appState}>
      <div className="h-full flex flex-col">
        <Header />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <main className="flex-1 flex overflow-hidden">
            {appState.activeView === 'mode' ? (
              <ModeView />
            ) : appState.activeView === 'workspace' ? (
              <WorkspaceView />
            ) : (
              <EmptyState />
            )}
          </main>
        </div>
      </div>
    </AppProvider>
  )
}

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="mx-auto mb-4 opacity-50"
        >
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <path d="M13 2v7h7" />
        </svg>
        <p>Create a workspace to add your first link</p>
      </div>
    </div>
  )
}
