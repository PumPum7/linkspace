import { DEFAULT_ICONS } from '@/lib/storage'
import { useEffect, useRef, useState } from 'react'
import { useApp } from './AppContext'
import { PromptDialog } from './Dialogs'
import { SettingsModal } from './SettingsModal'

export function Header() {
  const [showSettings, setShowSettings] = useState(false)
  const [showNewMenu, setShowNewMenu] = useState(false)
  const [showWorkspacePrompt, setShowWorkspacePrompt] = useState(false)
  const [showModePrompt, setShowModePrompt] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { updateData, setCurrentWorkspace, setCurrentMode } = useApp()

  useEffect(() => {
    if (!showNewMenu) return
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setShowNewMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showNewMenu])

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
    <>
      <header className="flex items-center justify-between px-4 py-2 border-b border-border">
        <h1 className="text-sm font-semibold">LinkSpace</h1>
        <div className="flex items-center gap-1">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowNewMenu((prev) => !prev)}
              className="btn btn-secondary"
              aria-expanded={showNewMenu}
              aria-haspopup="menu"
            >
              <PlusIcon /> New
            </button>
            {showNewMenu ? (
              <div className="menu">
                <button
                  type="button"
                  onClick={() => {
                    setShowWorkspacePrompt(true)
                    setShowNewMenu(false)
                  }}
                  className="menu-item"
                >
                  New workspace
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModePrompt(true)
                    setShowNewMenu(false)
                  }}
                  className="menu-item"
                >
                  New mode
                </button>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="icon-btn"
            title="Settings"
          >
            <SettingsIcon />
          </button>
        </div>
      </header>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
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
    </>
  )
}

function SettingsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
