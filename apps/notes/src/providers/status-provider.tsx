'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface SaveStatusContextType {
  saveStatus: SaveStatus
  setSaveStatus: (status: SaveStatus) => void
  saveStatusText: string
  setSaveStatusText: (text: string) => void
}

const SaveStatusContext = createContext<SaveStatusContextType | undefined>(undefined)

export function SaveStatusProvider({ children }: { children: ReactNode }) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveStatusText, setSaveStatusText] = useState<string>('All changes saved')

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
