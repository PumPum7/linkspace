const STORAGE_KEY = 'linkspace-data-v1'

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  createContextMenu()
})

// Handle messages from popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'ENSURE_CONTEXT_MENU') {
    createContextMenu()
  }
})

function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'save-to-linkspace',
      title: 'Save link to LinkSpace',
      contexts: ['link', 'page'],
    })
  })
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'save-to-linkspace') return

  const url = info.linkUrl || info.pageUrl
  const title = info.linkUrl ? info.selectionText || url : tab?.title || url

  if (!url) return

  try {
    const stored = await chrome.storage.local.get(STORAGE_KEY)
    const data = stored[STORAGE_KEY]

    if (!data) {
      showNotification(
        'Error',
        'LinkSpace data not found. Open the extension first.',
      )
      return
    }

    const workspaceId =
      data.preferences?.quickAddWorkspaceId || data.workspaces?.[0]?.id
    const workspace = data.workspaces?.find(
      (w: { id: string }) => w.id === workspaceId,
    )

    if (!workspace) {
      showNotification('Error', 'No workspace available. Create one first.')
      return
    }

    // Add the link
    const newLink = {
      id: crypto.randomUUID(),
      type: 'link',
      title: title || 'Untitled',
      url,
    }

    workspace.nodes = workspace.nodes || []
    workspace.nodes.push(newLink)

    await chrome.storage.local.set({ [STORAGE_KEY]: data })
    showNotification('Saved!', `"${title}" added to ${workspace.name}`)
  } catch (error) {
    console.error('Failed to save link', error)
    showNotification('Error', 'Failed to save link')
  }
})

function showNotification(title: string, message: string) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
  })
}
