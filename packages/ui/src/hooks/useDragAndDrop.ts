import { useState, useRef } from 'react'

export interface DragAndDropOptions {
  onFilesDrop?: (files: File[]) => void
  acceptTypes?: string[]
  multiple?: boolean
}

export interface DragAndDropState {
  isDragActive: boolean
  draggedFiles: File[]
}

export function useDragAndDrop(options: DragAndDropOptions = {}) {
  const [state, setState] = useState<DragAndDropState>({
    isDragActive: false,
    draggedFiles: []
  })
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setState((prev) => ({ ...prev, isDragActive: true }))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
    setState((prev) => ({ ...prev, isDragActive: true }))
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Only set dragActive to false if we're leaving the drop zone
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setState((prev) => ({ ...prev, isDragActive: false }))
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setState((prev) => ({ ...prev, isDragActive: false }))

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files)

      // Filter by accept types if specified
      let validFiles = droppedFiles
      if (options.acceptTypes) {
        validFiles = droppedFiles.filter((file) =>
          options.acceptTypes!.some(
            (type) => file.type.startsWith(type) || file.name.endsWith(type)
          )
        )
      }

      if (validFiles.length > 0) {
        setState((prev) => ({ ...prev, draggedFiles: validFiles }))
        options.onFilesDrop?.(validFiles)
      }
    }
  }

  const resetDragState = () => {
    setState((prev) => ({ ...prev, isDragActive: false, draggedFiles: [] }))
  }

  const getDropZoneProps = () => ({
    ref: dropZoneRef,
    onDragEnter: handleDragEnter,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop
  })

  return {
    ...state,
    resetDragState,
    getDropZoneProps,
    dropZoneRef
  }
}
