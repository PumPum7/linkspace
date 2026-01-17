import { useState } from 'react'
import { SettingsModal } from './SettingsModal'

export function Header() {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <>
      <header className="flex items-center justify-between px-4 py-2 border-b border-border">
        <h1 className="text-sm font-semibold">LinkSpace</h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="icon-btn"
            title="Settings"
          >
            <SettingsIcon />
          </button>
        </div>
      </header>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  )
}

function SettingsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
  )
}
