'use client'

import { Button } from '@repo/ui/components/base/button'
import { Input } from '@repo/ui/components/base/input'
import { Search, X } from 'lucide-react'
import { useState, useContext } from 'react'

import { FilesContext } from '@/features/files/providers/files-context-provider'

interface SearchClientProps {
  placeholder?: string
  className?: string
  value?: string
  onChange?: (value: string) => void
}

export function SearchClient({
  placeholder = 'Search files...',
  className = '',
  value: controlledValue,
  onChange
}: SearchClientProps) {
  const { searchQuery, setSearchQuery, isSearching, clearSearch } = useContext(FilesContext)
  const [uncontrolledValue, setUncontrolledValue] = useState('')

  // Use controlled value if provided, otherwise use context value or uncontrolled value
  const value = controlledValue !== undefined ? controlledValue : searchQuery || uncontrolledValue

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value

    if (controlledValue !== undefined) {
      // If controlled, call the onChange prop
      onChange?.(newValue)
    } else {
      // If uncontrolled, update the context and internal state
      setUncontrolledValue(newValue)
      setSearchQuery(newValue)
    }
  }

  function handleClear() {
    if (controlledValue !== undefined) {
      onChange?.('')
    } else {
      setUncontrolledValue('')
      clearSearch()
    }
  }

  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
        <Search className="size-4" />
      </span>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="pl-8 pr-8"
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
          aria-label="Clear search"
        >
          <X className="size-3" />
        </Button>
      )}
      {isSearching && (
        <div className="absolute right-8 top-1/2 -translate-y-1/2">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  )
}
