import { columns } from '@/components/files-table/columns'
import { DataTable } from '@/components/files-table/data-table'

export default function FileExplorerPage() {
  // Next.js catch-all route: params.path is string[] | undefined
  // const params = useParams() as { path?: string[] }
  // Join path segments to get the current path string
  // const currentPath = params.path ? params.path.join('/') : ''

  // The context will sync with the router, so just render the table
  return <DataTable columns={columns} />
}
