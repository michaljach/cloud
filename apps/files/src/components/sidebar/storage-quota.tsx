'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@repo/ui/components/base/card'
import { useUser } from '@repo/contexts'
import { getCurrentUser } from '@repo/api'
import { formatFileSize } from '@repo/utils'

interface StorageQuotaProps {
  className?: string
}

interface StorageInfo {
  used: number
  total: number
  percentage: number
}

export function StorageQuota({ className = '' }: StorageQuotaProps) {
  const { accessToken, refreshStorageQuota } = useUser()
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    used: 0,
    total: 1024 * 1024 * 1024, // 1GB default
    percentage: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStorageQuota = async () => {
    if (!accessToken) return

    try {
      setLoading(true)
      setError(null)
      const userData = await getCurrentUser(accessToken)

      const used = userData.storageQuota.totalUsage.bytes || 0
      const total = 1024 * 1024 * 1024 // 1GB default, could be made configurable
      const percentage = Math.round((used / total) * 100)

      setStorageInfo({ used, total, percentage })
    } catch (err) {
      setError('Failed to load storage information')
      console.error('Error fetching storage quota:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStorageQuota()
  }, [accessToken])

  useEffect(() => {
    const handleStorageRefresh = () => {
      fetchStorageQuota()
    }

    // Custom event listener for storage quota refresh
    window.addEventListener('storage-quota-refresh', handleStorageRefresh)

    return () => {
      window.removeEventListener('storage-quota-refresh', handleStorageRefresh)
    }
  }, [accessToken])

  const getStatusText = (percentage: number) => {
    if (percentage >= 90) return 'Critical'
    if (percentage >= 75) return 'Warning'
    return 'Good'
  }

  if (loading) {
    return (
      <Card className={className}>
        <div className="p-4">
          <div className="animate-pulse" data-testid="loading-skeleton">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-2 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <div className="p-4">
          <div className="text-red-500 text-sm">{error}</div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Storage</h3>
          <span className="text-xs text-gray-500">
            {formatFileSize(storageInfo.used)} / {formatFileSize(storageInfo.total)}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Usage</span>
            <span
              className={`font-medium ${
                storageInfo.percentage >= 90
                  ? 'text-red-600'
                  : storageInfo.percentage >= 75
                    ? 'text-yellow-600'
                    : 'text-green-600'
              }`}
            >
              {getStatusText(storageInfo.percentage)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                storageInfo.percentage >= 90
                  ? 'bg-red-500'
                  : storageInfo.percentage >= 75
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
              }`}
              style={{ width: `${storageInfo.percentage}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 text-center">{storageInfo.percentage}% used</div>
        </div>

        <div className="text-xs text-gray-500">
          {formatFileSize(storageInfo.total - storageInfo.used)} available
        </div>
      </div>
    </Card>
  )
}
