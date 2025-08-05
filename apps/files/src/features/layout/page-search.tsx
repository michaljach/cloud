'use client'

import { useState } from 'react'
import { Input } from '@repo/ui/components/base/input'
import { Search } from 'lucide-react'

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
  const [uncontrolledValue, setUncontrolledValue] = useState('')
  const value = controlledValue !== undefined ? controlledValue : uncontrolledValue

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUncontrolledValue(e.target.value)
    onChange?.(e.target.value)
  }

  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">
        <Search className="size-4" />
      </span>
      <Input placeholder={placeholder} value={value} onChange={handleChange} className="pl-8" />
    </div>
  )
}
