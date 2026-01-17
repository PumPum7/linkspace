import type { TreeNode } from '@/types'
import { useCallback, useEffect, useRef, useState } from 'react'

interface UseKeyboardNavigationOptions {
  nodes: TreeNode[]
  onOpenLink: (url: string) => void
  onDeleteLink: (id: string) => void
  onDeleteFolder: (id: string) => void
  onToggleFolder: (id: string) => void
  enabled?: boolean
}

// Flatten tree to get navigable items
function flattenNodes(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = []
  for (const node of nodes) {
    result.push(node)
    if (node.type === 'folder' && node.isExpanded && node.nodes.length > 0) {
      result.push(...flattenNodes(node.nodes))
    }
  }
  return result
}

export function useKeyboardNavigation({
  nodes,
  onOpenLink,
  onDeleteLink,
  onDeleteFolder,
  onToggleFolder,
  enabled = true,
}: UseKeyboardNavigationOptions) {
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const flatNodes = flattenNodes(nodes)
  const containerRef = useRef<HTMLElement | null>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled || flatNodes.length === 0) return

      // Don't handle if focus is in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return
      }

      const currentIndex = focusedId
        ? flatNodes.findIndex((n) => n.id === focusedId)
        : -1

      switch (e.key) {
        case 'ArrowDown':
        case 'j': {
          e.preventDefault()
          const nextIndex =
            currentIndex < flatNodes.length - 1 ? currentIndex + 1 : 0
          setFocusedId(flatNodes[nextIndex].id)
          break
        }

        case 'ArrowUp':
        case 'k': {
          e.preventDefault()
          const prevIndex =
            currentIndex > 0 ? currentIndex - 1 : flatNodes.length - 1
          setFocusedId(flatNodes[prevIndex].id)
          break
        }

        case 'Enter': {
          if (!focusedId) return
          e.preventDefault()
          const node = flatNodes.find((n) => n.id === focusedId)
          if (!node) return

          if (node.type === 'link') {
            onOpenLink(node.url)
          } else if (node.type === 'folder') {
            onToggleFolder(node.id)
          }
          break
        }

        case 'Delete':
        case 'Backspace': {
          if (!focusedId) return
          // Only handle delete if not in an input
          e.preventDefault()
          const node = flatNodes.find((n) => n.id === focusedId)
          if (!node) return

          if (node.type === 'link') {
            onDeleteLink(node.id)
          } else if (node.type === 'folder') {
            onDeleteFolder(node.id)
          }

          // Move focus to next item
          const deletedIndex = flatNodes.findIndex((n) => n.id === focusedId)
          const nextFocusIndex =
            deletedIndex < flatNodes.length - 1
              ? deletedIndex + 1
              : deletedIndex - 1
          setFocusedId(
            nextFocusIndex >= 0 ? flatNodes[nextFocusIndex]?.id || null : null,
          )
          break
        }

        case 'ArrowRight': {
          if (!focusedId) return
          const node = flatNodes.find((n) => n.id === focusedId)
          if (node?.type === 'folder' && !node.isExpanded) {
            e.preventDefault()
            onToggleFolder(node.id)
          }
          break
        }

        case 'ArrowLeft': {
          if (!focusedId) return
          const node = flatNodes.find((n) => n.id === focusedId)
          if (node?.type === 'folder' && node.isExpanded) {
            e.preventDefault()
            onToggleFolder(node.id)
          }
          break
        }

        case 'Escape': {
          setFocusedId(null)
          break
        }
      }
    },
    [
      enabled,
      flatNodes,
      focusedId,
      onOpenLink,
      onDeleteLink,
      onDeleteFolder,
      onToggleFolder,
    ],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Reset focus when nodes change significantly
  useEffect(() => {
    if (focusedId && !flatNodes.find((n) => n.id === focusedId)) {
      setFocusedId(null)
    }
  }, [flatNodes, focusedId])

  return {
    focusedId,
    setFocusedId,
    containerRef,
  }
}
