import { columns } from '@/components/files-table/columns'
import { DataTable } from '@/components/files-table/data-table'

export default function FileExplorerPage() {
  // Next.js catch-all route: params.path is string[] | undefined
  // const params = useParams() as { path?: string[] }
  // Join path segments to get the current path string
  // const currentPath = params.path ? params.path.join('/') : ''

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Files</h1>
        <p className="text-muted-foreground">Manage and organize your files and folders</p>
      </div>

      {/* The context will sync with the router, so just render the table */}
      <DataTable columns={columns} />
    </div>
  )
}
