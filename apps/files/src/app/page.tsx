import { columns } from '@/components/files-table/columns'
import { DataTable } from '@/components/files-table/data-table'

export default function Home() {
  return <DataTable columns={columns} />
}
