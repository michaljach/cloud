import { columns } from '@/components/files-table/columns'
import { DataTable } from '@/components/files-table/data-table'

export default function Home() {
  const data = [
    {
      id: '728ed52f',
      amount: 100,
      status: 'pending',
      email: 'm@example.com'
    }
    // ...
  ]

  return (
    <>
      <DataTable columns={columns} data={data} />
    </>
  )
}
