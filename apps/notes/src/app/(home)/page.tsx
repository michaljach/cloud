import React from 'react'

export default function Home() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome to Notes</h1>
        <p className="text-muted-foreground">
          Select a note from the sidebar or create a new one to get started.
        </p>
      </div>
    </div>
  )
}
