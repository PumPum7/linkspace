import { useEffect, useId, useState } from 'react'

interface BaseDialogProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'primary' | 'danger'
}

export function ConfirmDialog({
  open,
  title,
  description,
  onClose,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
}: BaseDialogProps & { onConfirm: () => void }) {
  if (!open) return null

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
        <div className="mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          ) : null}
        </div>
        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={`btn ${
              confirmVariant === 'danger' ? 'btn-danger' : 'btn-primary'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

interface PromptDialogProps extends BaseDialogProps {
  label: string
  placeholder?: string
  defaultValue?: string
  onConfirm: (value: string) => void
}

export function PromptDialog({
  open,
  title,
  description,
  label,
  placeholder,
  defaultValue = '',
  onClose,
  onConfirm,
  confirmLabel = 'Save',
  cancelLabel = 'Cancel',
}: PromptDialogProps) {
  const inputId = useId()
  const [value, setValue] = useState(defaultValue)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setValue(defaultValue)
      setError('')
    }
  }, [open, defaultValue])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) {
      setError('This field is required.')
      return
    }
    onConfirm(value.trim())
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
        <div className="mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          ) : null}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor={inputId} className="block text-sm font-medium mb-1">
              {label}
            </label>
            <input
              id={inputId}
              type="text"
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                if (error) setError('')
              }}
              className="input"
              placeholder={placeholder}
            />
            {error ? (
              <div className="text-xs text-red-600 mt-1">{error}</div>
            ) : null}
          </div>
          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              {cancelLabel}
            </button>
            <button type="submit" className="btn btn-primary">
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
