import { createDefaultData, loadData, saveData } from '@/lib/storage'
import type { ActiveView, AppData, Mode, Workspace } from '@/types'
import { useCallback, useEffect, useState } from 'react'

interface AppState {
  data: AppData
  currentWorkspaceId: string | null
  currentModeId: string | null
  activeView: ActiveView
  isLoading: boolean
}

interface AppActions {
  setCurrentWorkspace: (id: string) => void
  setCurrentMode: (id: string) => void
  updateData: (updater: (data: AppData) => AppData) => Promise<void>
  getWorkspace: (id: string | null) => Workspace | null
  getMode: (id: string | null) => Mode | null
}

export function useAppState(): AppState & AppActions {
  const [state, setState] = useState<AppState>({
    data: createDefaultData(),
    currentWorkspaceId: null,
    currentModeId: null,
    activeView: null,
    isLoading: true,
  })

  // Load initial data
  useEffect(() => {
    loadData().then((data) => {
      // Restore persisted selections
      let workspaceId = data.selectedWorkspaceId
      let modeId = data.selectedModeId
      let activeView = data.activeView

      // Validate workspace still exists
      if (workspaceId && !data.workspaces.find((w) => w.id === workspaceId)) {
        workspaceId = data.workspaces[0]?.id || null
      }

      // Validate mode still exists
      if (modeId && !data.modes.find((m) => m.id === modeId)) {
        modeId = data.modes[0]?.id || null
      }

      // If no active view but we have selections, infer from what exists
      if (!activeView) {
        if (workspaceId) {
          activeView = 'workspace'
        } else if (modeId) {
          activeView = 'mode'
        }
      }

      // Validate active view matches selection
      if (activeView === 'workspace' && !workspaceId) {
        activeView = modeId ? 'mode' : null
      }
      if (activeView === 'mode' && !modeId) {
        activeView = workspaceId ? 'workspace' : null
      }

      // First launch: set defaults
      if (!workspaceId && !modeId && data.workspaces.length > 0) {
        workspaceId = data.workspaces[0].id
        activeView = 'workspace'
      }

      setState({
        data,
        currentWorkspaceId: workspaceId,
        currentModeId: modeId,
        activeView,
        isLoading: false,
      })
    })
  }, [])

  const setCurrentWorkspace = useCallback((id: string) => {
    setState((prev) => {
      const newState = {
        ...prev,
        currentWorkspaceId: id,
        activeView: 'workspace' as ActiveView,
        data: {
          ...prev.data,
          selectedWorkspaceId: id,
          activeView: 'workspace' as ActiveView,
        },
      }
      saveData(newState.data)
      return newState
    })
  }, [])

  const setCurrentMode = useCallback((id: string) => {
    setState((prev) => {
      const newState = {
        ...prev,
        currentModeId: id,
        activeView: 'mode' as ActiveView,
        data: {
          ...prev.data,
          selectedModeId: id,
          activeView: 'mode' as ActiveView,
        },
      }
      saveData(newState.data)
      return newState
    })
  }, [])

  const updateData = useCallback(
    async (updater: (data: AppData) => AppData) => {
      setState((prev) => {
        const newData = updater(prev.data)

        // Persist selections
        newData.selectedWorkspaceId = prev.currentWorkspaceId
        newData.selectedModeId = prev.currentModeId
        newData.activeView = prev.activeView

        saveData(newData)
        return { ...prev, data: newData }
      })
    },
    [],
  )

  const getWorkspace = useCallback(
    (id: string | null): Workspace | null => {
      if (!id) return null
      return state.data.workspaces.find((w) => w.id === id) || null
    },
    [state.data.workspaces],
  )

  const getMode = useCallback(
    (id: string | null): Mode | null => {
      if (!id) return null
      return state.data.modes.find((m) => m.id === id) || null
    },
    [state.data.modes],
  )

  return {
    ...state,
    setCurrentWorkspace,
    setCurrentMode,
    updateData,
    getWorkspace,
    getMode,
  }
}
