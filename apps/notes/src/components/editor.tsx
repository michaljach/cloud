'use client'

import React, { useState } from 'react'
import { SidebarClose, SidebarOpenIcon } from 'lucide-react'
import { Toggle } from '@repo/ui/components/base/toggle'
import { parseMarkdown, parseInline } from '../utils/markdown'

export function Editor({
  value: controlledValue,
  onChange
}: { value?: string; onChange?: (v: string) => void } = {}) {
  const [value, setValue] = useState<string>(controlledValue ?? '')
  const [open, setOpen] = useState(true)

  React.useEffect(() => {
    if (controlledValue !== undefined) setValue(controlledValue)
  }, [controlledValue])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    onChange?.(e.target.value)
  }

  return (
    <div className="flex w-full h-full min-h-0 flex-col">
      <div className="flex items-center justify-end p-2 gap-2 border-b">
        <Toggle
          pressed={open}
          onPressedChange={setOpen}
          variant="default"
          size="sm"
          aria-label={open ? 'Hide Preview' : 'Show Preview'}
          className="px-3 py-1"
        >
          {open ? <SidebarOpenIcon /> : <SidebarClose />}
        </Toggle>
      </div>
      <div className="flex w-full h-full min-h-0 overflow-hidden">
        <textarea
          className={`h-full min-h-0 p-4 border-r resize-none outline-none font-mono text-base bg-background transition-all duration-300 ${open ? 'w-1/2' : 'w-full'}`}
          style={{ height: '100%', minHeight: 0 }}
          value={value}
          onChange={handleChange}
          placeholder="Write your markdown here..."
          spellCheck={false}
        />
        <div
          className={`h-full min-h-0 p-4 prose dark:prose-invert bg-background overflow-auto transition-all duration-300 ${open ? 'w-1/2 opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}
          style={{ height: '100%', minHeight: 0 }}
        >
          {parseMarkdown(value)}
        </div>
      </div>
    </div>
  )
}
