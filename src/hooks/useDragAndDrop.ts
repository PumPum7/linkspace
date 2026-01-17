import { findNodeById, nodeContainsId } from '@/lib/storage'
import type { TreeNode } from '@/types'
import { useCallback, useRef, useState } from 'react'

export type DropPosition = 'before' | 'after' | 'inside' | null

interface DragState {
  draggingId: string | null
  overId: string | null
  position: DropPosition
}

interface UseDragAndDropOptions {
  nodes: TreeNode[]
  onReorder: (
    dragId: string,
    targetId: string | null,
    position: DropPosition,
  ) => void
}

export function useDragAndDrop({ nodes, onReorder }: UseDragAndDropOptions) {
  const [dragState, setDragState] = useState<DragState>({
    draggingId: null,
    overId: null,
    position: null,
  })

  const dragRef = useRef<DragState>(dragState)
  dragRef.current = dragState

  const handleDragStart = useCallback((e: React.DragEvent, nodeId: string) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', nodeId)
    setDragState({ draggingId: nodeId, overId: null, position: null })
  }, [])

  const handleDragOver = useCallback(
    (e: React.DragEvent, nodeId: string) => {
      const { draggingId } = dragRef.current
      if (!draggingId || draggingId === nodeId) return

      e.preventDefault()
      e.stopPropagation()

      const rect = e.currentTarget.getBoundingClientRect()
      const offset = e.clientY - rect.top
      const threshold = rect.height * 0.25

      let position: DropPosition
      if (offset < threshold) {
        position = 'before'
      } else if (offset > rect.height - threshold) {
        position = 'after'
      } else {
        // Check if target is a folder
        const info = findNodeById(nodes, nodeId)
        if (info && info.node.type === 'folder') {
          position = 'inside'
        } else {
          position = offset < rect.height / 2 ? 'before' : 'after'
        }
      }

      setDragState((prev) => ({ ...prev, overId: nodeId, position }))
    },
    [nodes],
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if actually leaving the element
    const relatedTarget = e.relatedTarget as Node | null
    if (!e.currentTarget.contains(relatedTarget)) {
      setDragState((prev) => {
        if (prev.overId === (e.currentTarget as HTMLElement).dataset.nodeId) {
          return { ...prev, overId: null, position: null }
        }
        return prev
      })
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault()
      e.stopPropagation()

      const { draggingId, position } = dragRef.current
      if (!draggingId || !position) return

      // Prevent dropping into itself
      const dragInfo = findNodeById(nodes, draggingId)
      if (dragInfo && nodeContainsId(dragInfo.node, targetId)) {
        setDragState({ draggingId: null, overId: null, position: null })
        return
      }

      onReorder(draggingId, targetId, position)
      setDragState({ draggingId: null, overId: null, position: null })
    },
    [nodes, onReorder],
  )

  const handleDragEnd = useCallback(() => {
    setDragState({ draggingId: null, overId: null, position: null })
  }, [])

  // Handle drop on root (end of list)
  const handleRootDragOver = useCallback((e: React.DragEvent) => {
    if (!dragRef.current.draggingId) return
    e.preventDefault()
    setDragState((prev) => ({ ...prev, overId: null, position: 'after' }))
  }, [])

  const handleRootDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const { draggingId } = dragRef.current
      if (!draggingId) return

      onReorder(draggingId, null, 'after')
      setDragState({ draggingId: null, overId: null, position: null })
    },
    [onReorder],
  )

  const getDropClass = useCallback(
    (nodeId: string): string => {
      if (dragState.overId !== nodeId) return ''
      switch (dragState.position) {
        case 'before':
          return 'drop-before'
        case 'after':
          return 'drop-after'
        case 'inside':
          return 'drop-inside'
        default:
          return ''
      }
    },
    [dragState.overId, dragState.position],
  )

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    handleRootDragOver,
    handleRootDrop,
    getDropClass,
  }
}
