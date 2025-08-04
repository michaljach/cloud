import TrashClientPage from './TrashClientPage'

export default function TrashPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Trash</h1>
        <p className="text-muted-foreground">View and restore deleted files and folders</p>
      </div>

      <TrashClientPage />
    </div>
  )
}
