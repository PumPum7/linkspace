import type { ActiveView, AppData, Mode, Workspace } from '@/types'
import { type ReactNode, createContext, useContext } from 'react'

interface AppContextValue {
  data: AppData
  currentWorkspaceId: string | null
  currentModeId: string | null
  activeView: ActiveView
  isLoading: boolean
  setCurrentWorkspace: (id: string) => void
  setCurrentMode: (id: string) => void
  updateData: (updater: (data: AppData) => AppData) => Promise<void>
  getWorkspace: (id: string | null) => Workspace | null
  getMode: (id: string | null) => Mode | null
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({
  value,
  children,
}: {
  value: AppContextValue
  children: ReactNode
}) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
