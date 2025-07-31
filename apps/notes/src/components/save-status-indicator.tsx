'use client'

import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useSaveStatus } from './save-status-context'

export function SaveStatusIndicator() {
  const { saveStatus, saveStatusText } = useSaveStatus()

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <Loader2 data-testid="saving-icon" className="w-4 h-4 animate-spin text-blue-500" />
      case 'saved':
        return <CheckCircle data-testid="saved-icon" className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle data-testid="error-icon" className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      {getSaveStatusIcon()}
      <span>{saveStatusText}</span>
    </div>
  )
}
