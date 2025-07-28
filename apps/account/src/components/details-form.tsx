'use client'

import { useState } from 'react'
import { useUser } from '@repo/auth'
import { User } from '@repo/types'
import { Button } from '@repo/ui/components/base/button'
import { Input } from '@repo/ui/components/base/input'
import { Label } from '@repo/ui/components/base/label'

interface DetailsFormProps {
  user: User
}

export function DetailsForm({ user }: DetailsFormProps) {
  const [fullName, setFullName] = useState(user.fullName || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // TODO: Implement form submission
    console.log('Form submitted:', { fullName })

    setTimeout(() => {
      setIsSubmitting(false)
    }, 1000)
  }

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-900">Personal Information</h4>
        <p className="text-gray-600 mt-2">Update your personal details and account information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm font-medium text-gray-700">
            Username
          </Label>
          <Input
            id="username"
            value={user.username}
            disabled
            className="bg-gray-50 border-gray-200"
          />
          <p className="text-sm text-gray-500">Username cannot be changed</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
            Full Name
          </Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="storageLimit" className="text-sm font-medium text-gray-700">
            Storage Limit
          </Label>
          <Input
            id="storageLimit"
            value={`${user.storageLimit} MB`}
            disabled
            className="bg-gray-50 border-gray-200"
          />
          <p className="text-sm text-gray-500">Storage limit is managed by administrators</p>
        </div>

        <div className="pt-4">
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? 'Updating...' : 'Update Details'}
          </Button>
        </div>
      </form>
    </div>
  )
}
