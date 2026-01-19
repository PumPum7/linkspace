import { DEFAULT_ICONS } from '@/lib/storage'
import { useApp } from './AppContext'

interface IconPickerModalProps {
  workspaceId: string
  onClose: () => void
}

export function IconPickerModal({
  workspaceId,
  onClose,
}: IconPickerModalProps) {
  const { updateData } = useApp()

  const handleSelectIcon = (icon: string) => {
    updateData((d) => ({
      ...d,
      workspaces: d.workspaces.map((w) =>
        w.id === workspaceId ? { ...w, icon } : w,
      ),
    }))
    onClose()
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
          <h2 className="text-lg font-semibold">Choose Icon</h2>
          <button type="button" onClick={onClose} className="icon-btn">
            <CloseIcon />
          </button>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {DEFAULT_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => handleSelectIcon(icon)}
              className="w-10 h-10 flex items-center justify-center text-xl rounded-md hover:bg-muted transition-colors"
            >
              {icon}
            </button>
          ))}
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
