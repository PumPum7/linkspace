export interface LinkNode {
  id: string
  type: 'link'
  title: string
  url: string
}

export interface FolderNode {
  id: string
  type: 'folder'
  name: string
  nodes: TreeNode[]
  isExpanded: boolean
}

export type TreeNode = LinkNode | FolderNode

export interface Workspace {
  id: string
  name: string
  icon: string
  nodes: TreeNode[]
}

export interface Mode {
  id: string
  name: string
  linkIds: string[]
}

export interface Preferences {
  quickAddWorkspaceId: string | null
}

export interface AppData {
  version: number
  workspaces: Workspace[]
  modes: Mode[]
  iconPalette: string[]
  preferences: Preferences
  selectedWorkspaceId: string | null
  selectedModeId: string | null
  activeView: 'workspace' | 'mode' | null
}

export type ActiveView = 'workspace' | 'mode' | null
