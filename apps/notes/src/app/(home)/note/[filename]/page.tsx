import { NoteEditorContainer } from '@/components/note-editor-container'

interface NotePageProps {
  params: Promise<{
    filename: string
  }>
}

export default async function NotePage({ params }: NotePageProps) {
  const { filename } = await params
  return <NoteEditorContainer filename={filename} />
}
