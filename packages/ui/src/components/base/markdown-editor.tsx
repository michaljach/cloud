'use client'

import MDEditor from '@uiw/react-md-editor'

export function Editor({ value, onChange }) {
  return <MDEditor value={value} onChange={onChange} height={500} />
}
