import { collectLinkEntries, getAllLinkIds } from '@/lib/storage'
import { useApp } from './AppContext'
import { Favicon } from './Favicon'

export function ModeView() {
  const { data, currentModeId, updateData, getMode } = useApp()
  const mode = getMode(currentModeId)

  if (!mode) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>Select a mode to configure it</p>
      </div>
    )
  }

  const handleRename = (newName: string) => {
    updateData((d) => ({
      ...d,
      modes: d.modes.map((m) =>
        m.id === mode.id ? { ...m, name: newName || 'Untitled mode' } : m,
      ),
    }))
  }

  const handleDelete = () => {
    if (!confirm('Delete this mode?')) return
    updateData((d) => ({
      ...d,
      modes: d.modes.filter((m) => m.id !== mode.id),
    }))
  }

  const handleToggleLink = (linkId: string, checked: boolean) => {
    updateData((d) => ({
      ...d,
      modes: d.modes.map((m) => {
        if (m.id !== mode.id) return m
        const newLinkIds = checked
          ? [...m.linkIds, linkId]
          : m.linkIds.filter((id) => id !== linkId)
        return { ...m, linkIds: newLinkIds }
      }),
    }))
  }

  const handleSelectAll = () => {
    const allIds = getAllLinkIds(data.workspaces)
    updateData((d) => ({
      ...d,
      modes: d.modes.map((m) =>
        m.id === mode.id ? { ...m, linkIds: allIds } : m,
      ),
    }))
  }

  const handleClearAll = () => {
    updateData((d) => ({
      ...d,
      modes: d.modes.map((m) => (m.id === mode.id ? { ...m, linkIds: [] } : m)),
    }))
  }

  const handleLaunch = async () => {
    if (!mode.linkIds.length) return

    const groups: {
      workspace: (typeof data.workspaces)[0]
      entries: ReturnType<typeof collectLinkEntries>
    }[] = []

    for (const workspace of data.workspaces) {
      const entries = collectLinkEntries(workspace).filter((e) =>
        mode.linkIds.includes(e.node.id),
      )
      if (entries.length) {
        groups.push({ workspace, entries })
      }
    }

    for (const group of groups) {
      const tabIds: number[] = []
      for (const entry of group.entries) {
        try {
          const tab = await chrome.tabs.create({
            url: entry.node.url,
            active: false,
          })
          if (tab.id) tabIds.push(tab.id)
        } catch (error) {
          console.error('Failed to open tab', error)
        }
      }
      if (tabIds.length) {
        try {
          const groupId = await chrome.tabs.group({ tabIds })
          await chrome.tabGroups.update(groupId, {
            title: `${group.workspace.icon || '📁'} ${group.workspace.name}`,
          })
        } catch (error) {
          console.error('Failed to group tabs', error)
        }
      }
    }
  }

  const hasLinks = data.workspaces.some((w) => collectLinkEntries(w).length > 0)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <input
            type="text"
            value={mode.name}
            onChange={(e) => handleRename(e.target.value)}
            className="text-lg font-semibold bg-transparent border-none focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLaunch}
            className="btn btn-primary flex items-center gap-1"
            disabled={mode.linkIds.length === 0}
          >
            <PlayIcon /> Launch
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="btn btn-secondary"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="p-4 border-b border-border">
        <p className="text-sm text-muted-foreground">
          Select links from your workspaces to include in this mode:
        </p>
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={handleSelectAll}
            className="btn btn-secondary"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="btn btn-secondary"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Links list */}
      <div className="flex-1 overflow-y-auto p-4">
        {!hasLinks ? (
          <div className="text-center text-muted-foreground py-8">
            <p>Create folders/links in a workspace to configure this mode.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.workspaces.map((workspace) => {
              const entries = collectLinkEntries(workspace)
              if (!entries.length) return null

              return (
                <div key={workspace.id} className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    {workspace.icon || '📁'} {workspace.name}
                  </div>
                  {entries.map((entry) => {
                    const isChecked = mode.linkIds.includes(entry.node.id)
                    const pathLabel = entry.path.length
                      ? `${entry.path.join(' / ')} · `
                      : ''

                    return (
                      <label key={entry.node.id} className="mode-link-item">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            handleToggleLink(entry.node.id, e.target.checked)
                          }
                          className="rounded"
                        />
                        <Favicon
                          url={entry.node.url}
                          title={entry.node.title}
                          size={16}
                        />
                        <span className="flex-1 truncate">
                          {entry.node.title}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {pathLabel}
                          {entry.node.url}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function PlayIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}
