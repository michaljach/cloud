'use client'

import { FilesContext } from '@/components/files-context'
import { DataTable } from '@/components/files-table/data-table'
import { getTrashColumns } from '@/components/files-table/trash-columns'
import { useContext } from 'react'

function TrashTableWithFilesContext() {
  const { trashedFiles, refreshTrash } = useContext(FilesContext)
  const columns = getTrashColumns(refreshTrash)
  return <DataTable columns={columns} data={trashedFiles} />
}

export default function TrashClientPage() {
  return <TrashTableWithFilesContext />
}
