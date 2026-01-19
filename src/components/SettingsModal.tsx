import { migrateData } from '@/lib/storage'
import type { AppData } from '@/types'
import { useRef, useState } from 'react'
import { useApp } from './AppContext'
import { useToast } from './Toast'

interface SettingsModalProps {
  onClose: () => void
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { data, updateData } = useApp()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'linkspace-backup.json'
    link.click()
    URL.revokeObjectURL(url)
    showToast({
      title: 'Backup exported',
      description: 'Your data has been downloaded.',
      variant: 'success',
    })
  }

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as AppData
      migrateData(parsed)

      await updateData(() => parsed)
      showToast({
        title: 'Data imported',
        description: 'Your backup was successfully restored.',
        variant: 'success',
      })
      onClose()
    } catch (error) {
      console.error('Failed to import data', error)
      showToast({
        title: 'Import failed',
        description: 'The selected file is not a valid backup.',
        variant: 'error',
      })
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') onClose()
      }}
    >
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button type="button" onClick={onClose} className="icon-btn">
            <CloseIcon />
          </button>
        </div>

        <div className="space-y-6">
          {/* Data Section */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Data
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="btn btn-secondary"
              >
                Export Data
              </button>
              <button
                type="button"
                onClick={handleImport}
                className="btn btn-secondary"
                disabled={importing}
              >
                {importing ? 'Importing...' : 'Import Data'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Keyboard Shortcuts
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Open LinkSpace</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">
                  Ctrl+Shift+L
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>Search</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">
                  Ctrl+K
                </kbd>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">LinkSpace v1.0.0</p>
          </div>
        </div>
      </div>
    </div>
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
      aria-hidden="true"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}
