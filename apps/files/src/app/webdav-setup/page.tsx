'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@repo/ui/components/base/card'
import { Badge } from '@repo/ui/components/base/badge'
import { Button } from '@repo/ui/components/base/button'
import { Input } from '@repo/ui/components/base/input'
import { Label } from '@repo/ui/components/base/label'
import { Separator } from '@repo/ui/components/base/separator'
import { Copy, ExternalLink, Smartphone, Monitor } from 'lucide-react'

export default function WebDAVSetupPage() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const webdavUrl = `${baseUrl}/webdav`

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">WebDAV Setup</h1>
        <p className="text-muted-foreground">
          Access your files natively on iOS devices using WebDAV
        </p>
      </div>

      <div className="grid gap-6">
        {/* Connection Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Connection Details
            </CardTitle>
            <CardDescription>
              Use these settings to connect your iOS device to your cloud storage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="webdav-url">WebDAV URL</Label>
              <div className="flex gap-2">
                <Input id="webdav-url" value={webdavUrl} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(webdavUrl)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value="Your email address"
                readOnly
                className="font-mono text-sm"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                value="Your account password"
                readOnly
                className="font-mono text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary">HTTPS</Badge>
              <span className="text-sm text-muted-foreground">
                Use HTTPS in production for secure connections
              </span>
            </div>
          </CardContent>
        </Card>

        {/* iOS Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              iOS Setup Instructions
            </CardTitle>
            <CardDescription>
              Follow these steps to add your cloud storage to iOS Files app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Open Files App</p>
                  <p className="text-sm text-muted-foreground">
                    Launch the Files app on your iPhone or iPad
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Add Server</p>
                  <p className="text-sm text-muted-foreground">
                    Tap the three dots menu (⋯) in the top right, then select "Connect to Server"
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Enter Server Details</p>
                  <p className="text-sm text-muted-foreground">
                    Enter the WebDAV URL:{' '}
                    <code className="bg-muted px-1 rounded text-xs">{webdavUrl}</code>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  4
                </div>
                <div>
                  <p className="font-medium">Authenticate</p>
                  <p className="text-sm text-muted-foreground">
                    Enter your email address and password when prompted
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  5
                </div>
                <div>
                  <p className="font-medium">Access Your Files</p>
                  <p className="text-sm text-muted-foreground">
                    Your cloud storage will appear in the Files app under "Locations"
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>WebDAV Features</CardTitle>
            <CardDescription>What you can do with WebDAV integration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  ✓
                </Badge>
                <span className="text-sm">Browse files and folders</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  ✓
                </Badge>
                <span className="text-sm">Upload files from iOS</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  ✓
                </Badge>
                <span className="text-sm">Download files to device</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  ✓
                </Badge>
                <span className="text-sm">Create and delete folders</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  ✓
                </Badge>
                <span className="text-sm">Move and copy files</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  ✓
                </Badge>
                <span className="text-sm">Edit files directly in iOS apps</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
            <CardDescription>Common issues and solutions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Connection Failed</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Verify the WebDAV URL is correct</li>
                <li>• Check your internet connection</li>
                <li>• Ensure your credentials are correct</li>
                <li>• Try using HTTPS if available</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Authentication Error</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Double-check your email and password</li>
                <li>• Make sure your account is active</li>
                <li>• Try logging in to the web interface first</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Files Not Syncing</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Pull down to refresh in Files app</li>
                <li>• Check if the file size is within limits</li>
                <li>• Ensure you have sufficient storage space</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Security Notice</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-700 mb-3">
              For production use, ensure your WebDAV connection uses HTTPS to protect your data in
              transit.
            </p>
            <Button variant="outline" size="sm" className="border-orange-300 text-orange-700">
              <ExternalLink className="h-4 w-4 mr-2" />
              Learn More About Security
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
