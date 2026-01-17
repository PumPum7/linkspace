import {
  type DropPosition,
  useDragAndDrop,
  useKeyboardNavigation,
} from '@/hooks'
import {
  collectLinkEntries,
  collectLinkIdsFromNode,
  createFolderNode,
  createLinkNode,
  findNodeById,
  getNodesContainer,
  removeLinkIdsFromModes,
  removeNodeById,
} from '@/lib/storage'
import type { LinkNode, TreeNode } from '@/types'
import { useCallback, useState } from 'react'
import { useApp } from './AppContext'
import { Favicon } from './Favicon'
import { IconPickerModal } from './IconPickerModal'

export function WorkspaceView() {
  const { data, currentWorkspaceId, updateData, getWorkspace } = useApp()
  const workspace = getWorkspace(currentWorkspaceId)

  const [isAddingLink, setIsAddingLink] = useState(false)
  const [editingLink, setEditingLink] = useState<LinkNode | null>(null)
  const [linkParentId, setLinkParentId] = useState<string | null>(null)
  const [showIconPicker, setShowIconPicker] = useState(false)

  const handleReorder = useCallback(
    (dragId: string, targetId: string | null, position: DropPosition) => {
      if (!position) return

      updateData((d) => ({
        ...d,
        workspaces: d.workspaces.map((w) => {
          if (w.id !== currentWorkspaceId) return w

          // Deep clone nodes
          const newNodes = JSON.parse(JSON.stringify(w.nodes)) as TreeNode[]

          // Find and remove dragged node
          const dragInfo = findNodeById(newNodes, dragId)
          if (!dragInfo) return w

          const [dragNode] = dragInfo.parentNodes.splice(dragInfo.index, 1)

          if (!targetId) {
            // Drop at root level (end of list)
            newNodes.push(dragNode)
          } else {
            const targetInfo = findNodeById(newNodes, targetId)
            if (!targetInfo) {
              // Target not found, revert
              dragInfo.parentNodes.splice(dragInfo.index, 0, dragNode)
              return w
            }

            if (position === 'inside' && targetInfo.node.type === 'folder') {
              // Drop inside folder
              targetInfo.node.nodes = targetInfo.node.nodes || []
              targetInfo.node.nodes.push(dragNode)
            } else {
              // Drop before/after target
              let insertIndex = targetInfo.index
              if (position === 'after') insertIndex += 1
              targetInfo.parentNodes.splice(insertIndex, 0, dragNode)
            }
          }

          return { ...w, nodes: newNodes }
        }),
      }))
    },
    [currentWorkspaceId, updateData],
  )

  const dragHandlers = useDragAndDrop({
    nodes: workspace?.nodes || [],
    onReorder: handleReorder,
  })

  if (!workspace) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="mb-4">Create a workspace to get started</p>
        </div>
      </div>
    )
  }

  const handleRename = (newName: string) => {
    updateData((d) => ({
      ...d,
      workspaces: d.workspaces.map((w) =>
        w.id === workspace.id ? { ...w, name: newName || 'Untitled' } : w,
      ),
    }))
  }

  const handleDelete = () => {
    if (!confirm('Delete this workspace and all of its content?')) return

    const linkIds: string[] = []
    collectLinkEntries(workspace).forEach((entry) =>
      linkIds.push(entry.node.id),
    )

    updateData((d) => {
      const newModes = [...d.modes]
      removeLinkIdsFromModes(newModes, linkIds)

      return {
        ...d,
        workspaces: d.workspaces.filter((w) => w.id !== workspace.id),
        modes: newModes,
        preferences: {
          ...d.preferences,
          quickAddWorkspaceId:
            d.preferences.quickAddWorkspaceId === workspace.id
              ? d.workspaces.find((w) => w.id !== workspace.id)?.id || null
              : d.preferences.quickAddWorkspaceId,
        },
      }
    })
  }

  const handleAddFolder = (parentId: string | null = null) => {
    const name = prompt('Folder name?')
    if (!name) return

    updateData((d) => ({
      ...d,
      workspaces: d.workspaces.map((w) => {
        if (w.id !== workspace.id) return w
        const newWorkspace = {
          ...w,
          nodes: JSON.parse(JSON.stringify(w.nodes)),
        }
        const container = getNodesContainer(newWorkspace, parentId)
        container.push(createFolderNode(name.trim()))
        return newWorkspace
      }),
    }))
  }

  const handleSaveLink = (title: string, url: string) => {
    let finalUrl = url.trim()
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`
    }

    updateData((d) => ({
      ...d,
      workspaces: d.workspaces.map((w) => {
        if (w.id !== workspace.id) return w
        const newWorkspace = {
          ...w,
          nodes: JSON.parse(JSON.stringify(w.nodes)),
        }

        if (editingLink) {
          const info = findNodeById(newWorkspace.nodes, editingLink.id)
          if (info && info.node.type === 'link') {
            info.node.title = title
            info.node.url = finalUrl
          }
        } else {
          const container = getNodesContainer(newWorkspace, linkParentId)
          container.push(createLinkNode(title.trim(), finalUrl))
        }

        return newWorkspace
      }),
    }))

    setIsAddingLink(false)
    setEditingLink(null)
    setLinkParentId(null)
  }

  const handleDeleteLink = (linkId: string) => {
    updateData((d) => {
      const newModes = [...d.modes]
      removeLinkIdsFromModes(newModes, [linkId])

      return {
        ...d,
        workspaces: d.workspaces.map((w) => {
          if (w.id !== workspace.id) return w
          const newWorkspace = {
            ...w,
            nodes: JSON.parse(JSON.stringify(w.nodes)),
          }
          removeNodeById(newWorkspace, linkId)
          return newWorkspace
        }),
        modes: newModes,
      }
    })
  }

  const handleDeleteFolder = (folderId: string) => {
    if (!confirm('Delete this folder and everything inside it?')) return

    const info = findNodeById(workspace.nodes, folderId)
    if (!info || info.node.type !== 'folder') return

    const linkIds: string[] = []
    collectLinkIdsFromNode(info.node, linkIds)

    updateData((d) => {
      const newModes = [...d.modes]
      removeLinkIdsFromModes(newModes, linkIds)

      return {
        ...d,
        workspaces: d.workspaces.map((w) => {
          if (w.id !== workspace.id) return w
          const newWorkspace = {
            ...w,
            nodes: JSON.parse(JSON.stringify(w.nodes)),
          }
          removeNodeById(newWorkspace, folderId)
          return newWorkspace
        }),
        modes: newModes,
      }
    })
  }

  const handleToggleFolder = (folderId: string) => {
    updateData((d) => ({
      ...d,
      workspaces: d.workspaces.map((w) => {
        if (w.id !== workspace.id) return w
        const newWorkspace = {
          ...w,
          nodes: JSON.parse(JSON.stringify(w.nodes)),
        }
        const info = findNodeById(newWorkspace.nodes, folderId)
        if (info && info.node.type === 'folder') {
          info.node.isExpanded = !info.node.isExpanded
        }
        return newWorkspace
      }),
    }))
  }

  const { focusedId } = useKeyboardNavigation({
    nodes: workspace.nodes,
    onOpenLink: (url) => chrome.tabs.create({ url }),
    onDeleteLink: handleDeleteLink,
    onDeleteFolder: handleDeleteFolder,
    onToggleFolder: handleToggleFolder,
    enabled: !isAddingLink && !showIconPicker,
  })

  const handleExpandAll = () => {
    updateData((d) => ({
      ...d,
      workspaces: d.workspaces.map((w) => {
        if (w.id !== workspace.id) return w
        const setExpanded = (
          nodes: TreeNode[],
          expanded: boolean,
        ): TreeNode[] =>
          nodes.map((n) =>
            n.type === 'folder'
              ? {
                  ...n,
                  isExpanded: expanded,
                  nodes: setExpanded(n.nodes, expanded),
                }
              : n,
          )
        return { ...w, nodes: setExpanded(w.nodes, true) }
      }),
    }))
  }

  const handleCollapseAll = () => {
    updateData((d) => ({
      ...d,
      workspaces: d.workspaces.map((w) => {
        if (w.id !== workspace.id) return w
        const setExpanded = (
          nodes: TreeNode[],
          expanded: boolean,
        ): TreeNode[] =>
          nodes.map((n) =>
            n.type === 'folder'
              ? {
                  ...n,
                  isExpanded: expanded,
                  nodes: setExpanded(n.nodes, expanded),
                }
              : n,
          )
        return { ...w, nodes: setExpanded(w.nodes, false) }
      }),
    }))
  }

  const openLink = (url: string) => {
    chrome.tabs.create({ url })
  }

  const handleSaveCurrentTab = async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      })
      if (!tab?.url) {
        alert('No active tab found.')
        return
      }
      handleSaveLink(tab.title || tab.url, tab.url)
    } catch (error) {
      console.error('Failed to capture current tab', error)
      alert('Unable to capture the current tab.')
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowIconPicker(true)}
            className="text-xl cursor-pointer hover:opacity-80 hover:bg-muted rounded p-1 -m-1"
            title="Change icon"
          >
            {workspace.icon}
          </button>
          <input
            type="text"
            value={workspace.name}
            onChange={(e) => handleRename(e.target.value)}
            className="text-lg font-semibold bg-transparent border-none focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDelete}
            className="btn btn-secondary"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <button
          type="button"
          onClick={() => handleAddFolder(null)}
          className="btn btn-secondary"
        >
          Add folder
        </button>
        <button
          type="button"
          onClick={handleExpandAll}
          className="btn btn-secondary"
        >
          Expand all
        </button>
        <button
          type="button"
          onClick={handleCollapseAll}
          className="btn btn-secondary"
        >
          Collapse all
        </button>
      </div>

      {/* Add link buttons */}
      <div className="flex gap-2 p-3 border-b border-border">
        <button
          type="button"
          onClick={() => {
            setIsAddingLink(true)
            setLinkParentId(null)
          }}
          className="btn btn-secondary flex items-center gap-1"
        >
          <PlusIcon /> Add a link
        </button>
        <button
          type="button"
          onClick={handleSaveCurrentTab}
          className="btn btn-secondary"
        >
          Save current tab
        </button>
      </div>

      {/* Link list */}
      <div
        className="flex-1 overflow-y-auto p-3"
        onDragOver={dragHandlers.handleRootDragOver}
        onDrop={dragHandlers.handleRootDrop}
      >
        {workspace.nodes.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No folders or links yet. Use the toolbar to create them.</p>
          </div>
        ) : (
          <ul className="space-y-0.5">
            <NodeList
              nodes={workspace.nodes}
              depth={0}
              parentId={null}
              focusedId={focusedId}
              onOpenLink={openLink}
              onEditLink={(link, parentId) => {
                setEditingLink(link)
                setLinkParentId(parentId)
                setIsAddingLink(true)
              }}
              onDeleteLink={handleDeleteLink}
              onDeleteFolder={handleDeleteFolder}
              onToggleFolder={handleToggleFolder}
              onAddLink={(parentId) => {
                setIsAddingLink(true)
                setLinkParentId(parentId)
              }}
              onAddFolder={handleAddFolder}
              dragHandlers={dragHandlers}
            />
          </ul>
        )}
      </div>

      {/* Link Modal */}
      {isAddingLink && (
        <LinkModal
          link={editingLink}
          onSave={handleSaveLink}
          onClose={() => {
            setIsAddingLink(false)
            setEditingLink(null)
            setLinkParentId(null)
          }}
        />
      )}

      {/* Icon Picker Modal */}
      {showIconPicker && currentWorkspaceId && (
        <IconPickerModal
          workspaceId={currentWorkspaceId}
          onClose={() => setShowIconPicker(false)}
        />
      )}
    </div>
  )
}

interface DragHandlers {
  handleDragStart: (e: React.DragEvent, nodeId: string) => void
  handleDragOver: (e: React.DragEvent, nodeId: string) => void
  handleDragLeave: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent, targetId: string) => void
  handleDragEnd: () => void
  getDropClass: (nodeId: string) => string
}

interface NodeListProps {
  nodes: TreeNode[]
  depth: number
  parentId: string | null
  focusedId: string | null
  onOpenLink: (url: string) => void
  onEditLink: (link: LinkNode, parentId: string | null) => void
  onDeleteLink: (id: string) => void
  onDeleteFolder: (id: string) => void
  onToggleFolder: (id: string) => void
  onAddLink: (parentId: string) => void
  onAddFolder: (parentId: string) => void
  dragHandlers: DragHandlers
}

function NodeList({
  nodes,
  depth,
  parentId,
  focusedId,
  onOpenLink,
  onEditLink,
  onDeleteLink,
  onDeleteFolder,
  onToggleFolder,
  onAddLink,
  onAddFolder,
  dragHandlers,
}: NodeListProps) {
  return (
    <>
      {nodes.map((node) => (
        <li
          key={node.id}
          className={`tree-node ${dragHandlers.getDropClass(node.id)}`}
          draggable
          data-node-id={node.id}
          onDragStart={(e) => dragHandlers.handleDragStart(e, node.id)}
          onDragOver={(e) => dragHandlers.handleDragOver(e, node.id)}
          onDragLeave={dragHandlers.handleDragLeave}
          onDrop={(e) => dragHandlers.handleDrop(e, node.id)}
          onDragEnd={dragHandlers.handleDragEnd}
        >
          <div
            className={`tree-node-content group ${focusedId === node.id ? 'keyboard-focused' : ''}`}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
          >
            {node.type === 'folder' ? (
              <>
                <button
                  type="button"
                  onClick={() => onToggleFolder(node.id)}
                  className={`w-4 h-4 flex items-center justify-center transition-transform ${node.isExpanded ? 'rotate-0' : '-rotate-90'}`}
                >
                  <ChevronIcon />
                </button>
                <span className="tree-node-icon">📁</span>
                <span className="flex-1 truncate">{node.name}</span>
                <div className="tree-node-actions">
                  <button
                    type="button"
                    onClick={() => onAddLink(node.id)}
                    className="icon-btn"
                    title="Add link"
                  >
                    <PlusIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddFolder(node.id)}
                    className="icon-btn"
                    title="Add folder"
                  >
                    <FolderPlusIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteFolder(node.id)}
                    className="icon-btn"
                    title="Delete"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="w-4" />
                <Favicon url={node.url} title={node.title} size={20} />
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => onOpenLink(node.url)}
                >
                  <div className="truncate">{node.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {node.url}
                  </div>
                </div>
                <div className="tree-node-actions">
                  <button
                    type="button"
                    onClick={() => onOpenLink(node.url)}
                    className="icon-btn"
                    title="Open"
                  >
                    <ExternalLinkIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditLink(node, parentId)}
                    className="icon-btn"
                    title="Edit"
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteLink(node.id)}
                    className="icon-btn"
                    title="Delete"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </>
            )}
          </div>

          {node.type === 'folder' &&
            node.isExpanded &&
            node.nodes.length > 0 && (
              <ul className="tree-children">
                <NodeList
                  nodes={node.nodes}
                  depth={depth + 1}
                  parentId={node.id}
                  focusedId={focusedId}
                  onOpenLink={onOpenLink}
                  onEditLink={onEditLink}
                  onDeleteLink={onDeleteLink}
                  onDeleteFolder={onDeleteFolder}
                  onToggleFolder={onToggleFolder}
                  onAddLink={onAddLink}
                  onAddFolder={onAddFolder}
                  dragHandlers={dragHandlers}
                />
              </ul>
            )}
        </li>
      ))}
    </>
  )
}

interface LinkModalProps {
  link: LinkNode | null
  onSave: (title: string, url: string) => void
  onClose: () => void
}

function LinkModal({ link, onSave, onClose }: LinkModalProps) {
  const [title, setTitle] = useState(link?.title || '')
  const [url, setUrl] = useState(link?.url || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !url.trim()) {
      alert('Please fill in both the title and URL')
      return
    }
    onSave(title.trim(), url.trim())
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {link ? 'Edit Link' : 'Add Link'}
          </h2>
          <button type="button" onClick={onClose} className="icon-btn">
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="My Link"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="input"
              placeholder="https://example.com"
            />
          </div>
          <button type="submit" className="btn btn-primary w-full">
            Save Link
          </button>
        </form>
      </div>
    </div>
  )
}

// Icons
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

function ChevronIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function FolderPlusIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 6h18M9 6V4h6v2m-1 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V6h10" />
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}
