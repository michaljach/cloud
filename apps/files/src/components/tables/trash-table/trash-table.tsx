'use client'

import { useContext } from 'react'
import { FilesContext } from '@/providers/files-context-provider'
import { DataTable } from '../files-table/files-table'
import { getTrashColumns } from './trash-columns-config'

export function TrashTable() {
  const { trashedFiles, refreshTrash } = useContext(FilesContext)
  const columns = getTrashColumns(refreshTrash)
  return <DataTable columns={columns} data={trashedFiles} />
}
