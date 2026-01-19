import {
  AppProvider,
  Header,
  ModeView,
  PromptDialog,
  Sidebar,
  ToastProvider,
  useApp,
  WorkspaceView,
} from '@/components'
import { useAppState } from '@/hooks'
import { DEFAULT_ICONS } from '@/lib/storage'
import { useState } from 'react'

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
    <ToastProvider>
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
    </ToastProvider>
  )
}

function EmptyState() {
  const { updateData, setCurrentWorkspace, setCurrentMode } = useApp()
  const [showWorkspacePrompt, setShowWorkspacePrompt] = useState(false)
  const [showModePrompt, setShowModePrompt] = useState(false)

  const createWorkspace = (name: string) => {
    const workspace = {
      id: crypto.randomUUID(),
      name,
      icon: DEFAULT_ICONS[Math.floor(Math.random() * DEFAULT_ICONS.length)],
      nodes: [],
    }
    updateData((d) => ({
      ...d,
      workspaces: [...d.workspaces, workspace],
    }))
    setCurrentWorkspace(workspace.id)
  }

  const createMode = (name: string) => {
    const mode = {
      id: crypto.randomUUID(),
      name,
      linkIds: [],
    }
    updateData((d) => ({
      ...d,
      modes: [...d.modes, mode],
    }))
    setCurrentMode(mode.id)
  }

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
          aria-hidden="true"
        >
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <path d="M13 2v7h7" />
        </svg>
        <p className="mb-4">Create a workspace to add your first link</p>
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setShowWorkspacePrompt(true)}
            className="btn btn-primary"
          >
            Create workspace
          </button>
          <button
            type="button"
            onClick={() => setShowModePrompt(true)}
            className="btn btn-secondary"
          >
            Create mode
          </button>
        </div>
      </div>
      <PromptDialog
        open={showWorkspacePrompt}
        onClose={() => setShowWorkspacePrompt(false)}
        title="New workspace"
        label="Workspace name"
        placeholder="Personal"
        confirmLabel="Create workspace"
        onConfirm={createWorkspace}
      />
      <PromptDialog
        open={showModePrompt}
        onClose={() => setShowModePrompt(false)}
        title="New mode"
        label="Mode name"
        placeholder="Morning routine"
        confirmLabel="Create mode"
        onConfirm={createMode}
      />
    </div>
  )
}
