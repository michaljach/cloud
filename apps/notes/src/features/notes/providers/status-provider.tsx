'use client'

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface SaveStatusContextType {
  saveStatus: SaveStatus
  setSaveStatus: (status: SaveStatus) => void
  saveStatusText: string
  setSaveStatusText: (text: string) => void
}

const SaveStatusContext = createContext<SaveStatusContextType | undefined>(undefined)

export function SaveStatusProvider({ children }: { children: ReactNode }) {
  const [saveStatus, setSaveStatusState] = useState<SaveStatus>('idle')
  const [saveStatusText, setSaveStatusTextState] = useState<string>('All changes saved')

  const setSaveStatus = useCallback((status: SaveStatus) => {
    setSaveStatusState(status)
  }, [])

  const setSaveStatusText = useCallback((text: string) => {
    setSaveStatusTextState(text)
  }, [])

  return (
    <SaveStatusContext.Provider
      value={{
        saveStatus,
        setSaveStatus,
        saveStatusText,
        setSaveStatusText
      }}
    >
      {children}
    </SaveStatusContext.Provider>
  )
}

export function useSaveStatus() {
  const context = useContext(SaveStatusContext)
  if (context === undefined) {
    throw new Error('useSaveStatus must be used within a SaveStatusProvider')
  }
  return context
}
