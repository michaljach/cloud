import { FileUpload } from '@/components/file-upload'

export default function SettingsPage() {
  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <FileUpload />
    </div>
  )
}
