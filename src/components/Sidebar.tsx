import { DEFAULT_ICONS } from '@/lib/storage'
import { useCallback, useState } from 'react'
import { useApp } from './AppContext'

export function Sidebar() {
  const {
    data,
    currentWorkspaceId,
    currentModeId,
    activeView,
    setCurrentWorkspace,
    setCurrentMode,
    updateData,
  } = useApp()

  // Drag state for workspaces
  const [draggedWorkspaceId, setDraggedWorkspaceId] = useState<string | null>(
    null,
  )
  const [workspaceDropTarget, setWorkspaceDropTarget] = useState<{
    id: string
    position: 'before' | 'after'
  } | null>(null)

  // Drag state for modes
  const [draggedModeId, setDraggedModeId] = useState<string | null>(null)
  const [modeDropTarget, setModeDropTarget] = useState<{
    id: string
    position: 'before' | 'after'
  } | null>(null)

  const handleAddWorkspace = () => {
    const name = prompt('Workspace name?')
    if (!name) return

    const workspace = {
      id: crypto.randomUUID(),
      name: name.trim(),
      icon: DEFAULT_ICONS[Math.floor(Math.random() * DEFAULT_ICONS.length)],
      nodes: [],
    }

    updateData((d) => ({
      ...d,
      workspaces: [...d.workspaces, workspace],
    }))

    setCurrentWorkspace(workspace.id)
  }

  const handleAddMode = () => {
    const name = prompt('Mode name?')
    if (!name) return

    const mode = {
      id: crypto.randomUUID(),
      name: name.trim(),
      linkIds: [],
    }

    updateData((d) => ({
      ...d,
      modes: [...d.modes, mode],
    }))

    setCurrentMode(mode.id)
  }

  // Workspace drag handlers
  const handleWorkspaceDragStart = useCallback(
    (e: React.DragEvent, id: string) => {
      setDraggedWorkspaceId(id)
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', id)
    },
    [],
  )

  const handleWorkspaceDragOver = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault()
      if (!draggedWorkspaceId || draggedWorkspaceId === targetId) return

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const midY = rect.top + rect.height / 2
      const position = e.clientY < midY ? 'before' : 'after'

      setWorkspaceDropTarget({ id: targetId, position })
    },
    [draggedWorkspaceId],
  )

  const handleWorkspaceDragLeave = useCallback(() => {
    setWorkspaceDropTarget(null)
  }, [])

  const handleWorkspaceDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault()
      if (
        !draggedWorkspaceId ||
        draggedWorkspaceId === targetId ||
        !workspaceDropTarget
      )
        return

      updateData((d) => {
        const workspaces = [...d.workspaces]
        const dragIndex = workspaces.findIndex(
          (w) => w.id === draggedWorkspaceId,
        )
        const targetIndex = workspaces.findIndex((w) => w.id === targetId)

        if (dragIndex === -1 || targetIndex === -1) return d

        const [draggedItem] = workspaces.splice(dragIndex, 1)
        let insertIndex = targetIndex

        // Adjust if we removed an item before the target
        if (dragIndex < targetIndex) insertIndex--
        if (workspaceDropTarget.position === 'after') insertIndex++

        workspaces.splice(insertIndex, 0, draggedItem)

        return { ...d, workspaces }
      })

      setDraggedWorkspaceId(null)
      setWorkspaceDropTarget(null)
    },
    [draggedWorkspaceId, workspaceDropTarget, updateData],
  )

  const handleWorkspaceDragEnd = useCallback(() => {
    setDraggedWorkspaceId(null)
    setWorkspaceDropTarget(null)
  }, [])

  // Mode drag handlers
  const handleModeDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedModeId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }, [])

  const handleModeDragOver = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault()
      if (!draggedModeId || draggedModeId === targetId) return

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const midY = rect.top + rect.height / 2
      const position = e.clientY < midY ? 'before' : 'after'

      setModeDropTarget({ id: targetId, position })
    },
    [draggedModeId],
  )

  const handleModeDragLeave = useCallback(() => {
    setModeDropTarget(null)
  }, [])

  const handleModeDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault()
      if (!draggedModeId || draggedModeId === targetId || !modeDropTarget)
        return

      updateData((d) => {
        const modes = [...d.modes]
        const dragIndex = modes.findIndex((m) => m.id === draggedModeId)
        const targetIndex = modes.findIndex((m) => m.id === targetId)

        if (dragIndex === -1 || targetIndex === -1) return d

        const [draggedItem] = modes.splice(dragIndex, 1)
        let insertIndex = targetIndex

        if (dragIndex < targetIndex) insertIndex--
        if (modeDropTarget.position === 'after') insertIndex++

        modes.splice(insertIndex, 0, draggedItem)

        return { ...d, modes }
      })

      setDraggedModeId(null)
      setModeDropTarget(null)
    },
    [draggedModeId, modeDropTarget, updateData],
  )

  const handleModeDragEnd = useCallback(() => {
    setDraggedModeId(null)
    setModeDropTarget(null)
  }, [])

  const getWorkspaceDropClass = (id: string) => {
    if (!workspaceDropTarget || workspaceDropTarget.id !== id) return ''
    return workspaceDropTarget.position === 'before'
      ? 'sidebar-drop-before'
      : 'sidebar-drop-after'
  }

  const getModeDropClass = (id: string) => {
    if (!modeDropTarget || modeDropTarget.id !== id) return ''
    return modeDropTarget.position === 'before'
      ? 'sidebar-drop-before'
      : 'sidebar-drop-after'
  }

  return (
    <aside className="w-48 border-r border-border flex flex-col h-full overflow-hidden">
      {/* Workspaces Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Workspaces
            </span>
            <button
              type="button"
              onClick={handleAddWorkspace}
              className="icon-btn"
              title="Add workspace"
            >
              <PlusIcon />
            </button>
          </div>
          <ul className="space-y-0.5">
            {data.workspaces.map((workspace) => (
              <li
                key={workspace.id}
                draggable
                onDragStart={(e) => handleWorkspaceDragStart(e, workspace.id)}
                onDragOver={(e) => handleWorkspaceDragOver(e, workspace.id)}
                onDragLeave={handleWorkspaceDragLeave}
                onDrop={(e) => handleWorkspaceDrop(e, workspace.id)}
                onDragEnd={handleWorkspaceDragEnd}
                className={getWorkspaceDropClass(workspace.id)}
              >
                <button
                  type="button"
                  onClick={() => setCurrentWorkspace(workspace.id)}
                  className={`sidebar-item w-full text-left ${
                    currentWorkspaceId === workspace.id &&
                    activeView === 'workspace'
                      ? 'active'
                      : ''
                  } ${draggedWorkspaceId === workspace.id ? 'opacity-50' : ''}`}
                >
                  <span>{workspace.icon || '📁'}</span>
                  <span className="truncate">{workspace.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Modes Section */}
        <div className="p-3 pt-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Modes
            </span>
            <button
              type="button"
              onClick={handleAddMode}
              className="icon-btn"
              title="Add mode"
            >
              <PlusIcon />
            </button>
          </div>
          <ul className="space-y-0.5">
            {data.modes.map((mode) => (
              <li
                key={mode.id}
                draggable
                onDragStart={(e) => handleModeDragStart(e, mode.id)}
                onDragOver={(e) => handleModeDragOver(e, mode.id)}
                onDragLeave={handleModeDragLeave}
                onDrop={(e) => handleModeDrop(e, mode.id)}
                onDragEnd={handleModeDragEnd}
                className={getModeDropClass(mode.id)}
              >
                <button
                  type="button"
                  onClick={() => setCurrentMode(mode.id)}
                  className={`sidebar-item w-full text-left ${
                    currentModeId === mode.id && activeView === 'mode'
                      ? 'active'
                      : ''
                  } ${draggedModeId === mode.id ? 'opacity-50' : ''}`}
                >
                  <span>⚡</span>
                  <span className="truncate">{mode.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
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
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
