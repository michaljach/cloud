'use client'

import MDEditor from '@uiw/react-md-editor'

import type { FC } from 'react'

interface EditorProps {
  value: string
  onChange: (value: string | undefined) => void
}

export const Editor: FC<EditorProps> = ({ value, onChange }) => {
  return <MDEditor value={value} onChange={onChange} height={500} />
}
