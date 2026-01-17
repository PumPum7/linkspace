import type {
  AppData,
  FolderNode,
  LinkNode,
  Mode,
  TreeNode,
  Workspace,
} from '@/types'

export const STORAGE_KEY = 'linkspace-data-v1'
export const DATA_VERSION = 2

export const DEFAULT_ICONS = [
  '💼',
  '📚',
  '🧠',
  '🧪',
  '🧑‍💻',
  '🧘',
  '🏡',
  '🎯',
  '🌐',
  '📝',
  '📈',
  '📊',
  '📂',
  '🎓',
  '🗂️',
  '🧭',
  '🧱',
  '🪐',
]

export function createLinkNode(
  title: string,
  url: string,
  id = crypto.randomUUID(),
): LinkNode {
  return {
    id,
    type: 'link',
    title: title || 'Untitled',
    url,
  }
}

export function createFolderNode(name = 'New folder'): FolderNode {
  return {
    id: crypto.randomUUID(),
    type: 'folder',
    name: name || 'Untitled folder',
    nodes: [],
    isExpanded: true,
  }
}

function createDefaultWorkspace(
  name: string,
  icon: string,
  seedLinks: { title: string; url: string }[] = [],
): Workspace {
  return {
    id: crypto.randomUUID(),
    name,
    icon,
    nodes: seedLinks.map((seed) => createLinkNode(seed.title, seed.url)),
  }
}

export function createDefaultData(): AppData {
  return {
    version: DATA_VERSION,
    workspaces: [
      createDefaultWorkspace('Work', '💼', [
        { title: 'Email', url: 'https://mail.google.com' },
        { title: 'Calendar', url: 'https://calendar.google.com' },
      ]),
      createDefaultWorkspace('Uni', '📚', [
        { title: 'Canvas', url: 'https://canvas.instructure.com' },
        { title: 'Drive', url: 'https://drive.google.com' },
      ]),
    ],
    modes: [
      {
        id: crypto.randomUUID(),
        name: 'Uni Mode',
        linkIds: [],
      },
    ],
    iconPalette: DEFAULT_ICONS,
    preferences: {
      quickAddWorkspaceId: null,
    },
    selectedWorkspaceId: null,
    selectedModeId: null,
    activeView: null,
  }
}

function sanitizeNodes(nodes: TreeNode[]): void {
  for (const node of nodes) {
    node.id = node.id || crypto.randomUUID()
    if (node.type === 'folder') {
      node.name = node.name || 'Untitled folder'
      node.isExpanded = node.isExpanded !== false
      node.nodes = node.nodes || []
      sanitizeNodes(node.nodes)
    } else {
      node.title = node.title || 'Untitled'
    }
  }
}

function migrateWorkspace(workspace: Workspace & { links?: unknown[] }): void {
  if (!workspace.nodes) {
    const legacyLinks = (workspace.links || []) as {
      title: string
      url: string
      id?: string
    }[]
    workspace.nodes = legacyLinks.map((link) =>
      createLinkNode(link.title, link.url, link.id),
    )
    delete workspace.links
  }
  sanitizeNodes(workspace.nodes)
}

export function migrateData(data: AppData): void {
  if (!data.workspaces) {
    data.workspaces = []
  }

  for (const workspace of data.workspaces) {
    migrateWorkspace(workspace as Workspace & { links?: unknown[] })
  }

  if (!data.preferences) {
    data.preferences = { quickAddWorkspaceId: null }
  }

  if (data.activeView === undefined) {
    data.activeView = null
  }

  data.version = DATA_VERSION
}

export async function loadData(): Promise<AppData> {
  const stored = await chrome.storage.local.get(STORAGE_KEY)

  if (stored && stored[STORAGE_KEY]) {
    const data = stored[STORAGE_KEY] as AppData
    migrateData(data)
    return data
  }

  const defaultData = createDefaultData()
  await chrome.storage.local.set({ [STORAGE_KEY]: defaultData })
  return defaultData
}

export async function saveData(data: AppData): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: data })
}

// Tree navigation helpers
export interface NodeInfo {
  node: TreeNode
  parent: FolderNode | null
  parentNodes: TreeNode[]
  index: number
}

export function findNodeById(
  nodes: TreeNode[],
  id: string,
  parent: FolderNode | null = null,
): NodeInfo | null {
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index]
    if (node.id === id) {
      return { node, parent, parentNodes: nodes, index }
    }
    if (node.type === 'folder' && node.nodes?.length) {
      const found = findNodeById(node.nodes, id, node)
      if (found) return found
    }
  }
  return null
}

export function getNodesContainer(
  workspace: Workspace,
  parentId: string | null,
): TreeNode[] {
  if (!parentId) {
    workspace.nodes = workspace.nodes || []
    return workspace.nodes
  }
  const info = findNodeById(workspace.nodes, parentId)
  if (info && info.node.type === 'folder') {
    info.node.nodes = info.node.nodes || []
    return info.node.nodes
  }
  return workspace.nodes
}

export function removeNodeById(
  workspace: Workspace,
  nodeId: string,
): { node: TreeNode; parent: FolderNode | null } | null {
  const info = findNodeById(workspace.nodes, nodeId)
  if (!info) return null
  const [removed] = info.parentNodes.splice(info.index, 1)
  return { node: removed, parent: info.parent }
}

export interface LinkEntry {
  node: LinkNode
  path: string[]
}

export function collectLinkEntries(workspace: Workspace): LinkEntry[] {
  const entries: LinkEntry[] = []

  function walk(nodes: TreeNode[], path: string[]) {
    for (const node of nodes) {
      if (node.type === 'link') {
        entries.push({ node, path: [...path] })
      } else if (node.type === 'folder') {
        walk(node.nodes || [], [...path, node.name])
      }
    }
  }

  walk(workspace.nodes || [], [])
  return entries
}

export function collectLinkIdsFromNode(node: TreeNode, acc: string[]): void {
  if (node.type === 'link') {
    acc.push(node.id)
    return
  }
  for (const child of node.nodes || []) {
    collectLinkIdsFromNode(child, acc)
  }
}

export function getAllLinkIds(workspaces: Workspace[]): string[] {
  const ids: string[] = []
  for (const workspace of workspaces) {
    for (const entry of collectLinkEntries(workspace)) {
      ids.push(entry.node.id)
    }
  }
  return ids
}

export function removeLinkIdsFromModes(modes: Mode[], linkIds: string[]): void {
  if (!linkIds.length) return
  for (const mode of modes) {
    mode.linkIds = mode.linkIds.filter((id) => !linkIds.includes(id))
  }
}

export function nodeContainsId(node: TreeNode, targetId: string): boolean {
  if (node.id === targetId) return true
  if (node.type !== 'folder') return false
  return node.nodes.some((child) => nodeContainsId(child, targetId))
}
