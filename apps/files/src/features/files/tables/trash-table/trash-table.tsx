'use client'

import { useContext } from 'react'

import { DataTable } from '../files-table/files-table'

import { getTrashColumns } from './trash-columns-config'

import { FilesContext } from '@/features/files/providers/files-context-provider'

export function TrashTable() {
  const { trashedFiles, refreshTrash } = useContext(FilesContext)
  const columns = getTrashColumns(refreshTrash)
  return <DataTable columns={columns} data={trashedFiles} />
}
