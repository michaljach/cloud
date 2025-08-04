'use client'

import React, { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@repo/ui/components/base/input'
import { useContext } from 'react'
import { FilesContext } from '../providers/files-context'

interface PageSearchProps {
  placeholder?: string
  className?: string
}

export function PageSearch({ placeholder = 'Search files...', className = '' }: PageSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const { files } = useContext(FilesContext)

  const handleSearch = (value: string) => {
    setSearchTerm(value)

    if (value.trim()) {
      // Filter files based on search term
      const filteredFiles = files.filter((file: any) =>
        file.filename.toLowerCase().includes(value.toLowerCase())
      )

      // For now, just log the results
      // In a real implementation, you might want to update the files context
      console.log('Search results:', filteredFiles)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-10"
      />
    </div>
  )
}
