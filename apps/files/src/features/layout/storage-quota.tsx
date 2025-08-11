'use client'

import { useUser } from '@repo/providers'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/base/card'
import { Skeleton } from '@repo/ui/components/base/skeleton'
import { formatFileSize } from '@repo/utils'
import { HardDrive, FileText, Image } from 'lucide-react'
import React from 'react'

export function StorageQuota() {
  const { storageQuota, loading, error, user } = useUser()

  // Use user's actual storage limit (now in MB)
  const STORAGE_LIMIT_MB = user?.storageLimit // Default 1GB in MB

  if (loading) {
    return (
      <Card className="mx-2 mb-4">
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-2 w-full" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="mx-2 mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Storage Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Unable to load storage info</p>
        </CardContent>
      </Card>
    )
  }

  if (!storageQuota || !STORAGE_LIMIT_MB) return null

  const { totalUsage, breakdown } = storageQuota
  const usagePercentage = (totalUsage.megabytes / STORAGE_LIMIT_MB) * 100

  // Convert MB to bytes for formatFileSize
  const totalUsageBytes = totalUsage.megabytes * 1024 * 1024
  const storageLimitBytes = STORAGE_LIMIT_MB * 1024 * 1024
  const filesUsageBytes = breakdown.files.megabytes * 1024 * 1024
  const notesUsageBytes = breakdown.notes.megabytes * 1024 * 1024
  const photosUsageBytes = breakdown.photos.megabytes * 1024 * 1024

  return (
    <Card className="mx-2 mb-4">
      <CardContent className="space-y-3">
        {/* Total Usage */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Total Used</span>
            <span className="font-medium">
              {formatFileSize(totalUsageBytes)} / {formatFileSize(storageLimitBytes)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-blue-600" />
              <span className="text-muted-foreground">Files</span>
            </div>
            <span>{formatFileSize(filesUsageBytes)}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3 text-green-600" />
              <span className="text-muted-foreground">Notes</span>
            </div>
            <span>{formatFileSize(notesUsageBytes)}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <Image className="w-3 h-3 text-purple-600" />
              <span className="text-muted-foreground">Photos</span>
            </div>
            <span>{formatFileSize(photosUsageBytes)}</span>
          </div>
        </div>

        {/* Storage warning */}
        {usagePercentage > 80 && usagePercentage < 100 && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
            ⚠️ Storage usage is high ({usagePercentage.toFixed(1)}%)
          </div>
        )}

        {/* Storage limit exceeded */}
        {usagePercentage >= 100 && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            🚫 Storage limit exceeded ({usagePercentage.toFixed(1)}%)
          </div>
        )}
      </CardContent>
    </Card>
  )
}
