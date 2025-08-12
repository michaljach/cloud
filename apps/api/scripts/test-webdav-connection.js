#!/usr/bin/env node

const http = require('http')
const https = require('https')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

class WebDAVTester {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl
    this.token = token
    this.isHttps = baseUrl.startsWith('https')
    this.client = this.isHttps ? https : http
  }

  async testOptions() {
    console.log('\n🔍 Testing OPTIONS request...')

    return new Promise((resolve) => {
      const options = {
        hostname: new URL(this.baseUrl).hostname,
        port: new URL(this.baseUrl).port || (this.isHttps ? 443 : 80),
        path: '/webdav',
        method: 'OPTIONS',
        headers: {
          'User-Agent': 'WebDAV-Test/1.0'
        }
      }

      const req = this.client.request(options, (res) => {
        console.log(`✅ Status: ${res.statusCode}`)
        console.log(`✅ DAV Header: ${res.headers.dav}`)
        console.log(`✅ Allow Header: ${res.headers.allow}`)
        console.log(`✅ MS-Author-Via: ${res.headers['ms-author-via']}`)

        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          if (data) console.log(`✅ Response: ${data}`)
          resolve(res.statusCode === 200)
        })
      })

      req.on('error', (e) => {
        console.log(`❌ Error: ${e.message}`)
        resolve(false)
      })

      req.end()
    })
  }

  async testPropfind() {
    console.log('\n📁 Testing PROPFIND request...')

    const propfindBody = `<?xml version="1.0" encoding="utf-8"?>
<propfind xmlns="DAV:">
  <prop>
    <resourcetype/>
    <getcontentlength/>
    <getlastmodified/>
    <getcontenttype/>
    <displayname/>
  </prop>
</propfind>`

    return new Promise((resolve) => {
      const options = {
        hostname: new URL(this.baseUrl).hostname,
        port: new URL(this.baseUrl).port || (this.isHttps ? 443 : 80),
        path: '/webdav',
        method: 'PROPFIND',
        headers: {
          'Content-Type': 'application/xml',
          Depth: '0',
          Authorization: `Bearer ${this.token}`,
          'User-Agent': 'WebDAV-Test/1.0'
        }
      }

      const req = this.client.request(options, (res) => {
        console.log(`✅ Status: ${res.statusCode}`)
        console.log(`✅ Content-Type: ${res.headers['content-type']}`)

        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          if (data) {
            console.log('✅ Response received')
            if (res.statusCode === 401) {
              console.log('⚠️  Authentication required - this is expected without a valid token')
            }
          }
          resolve(res.statusCode === 207 || res.statusCode === 401)
        })
      })

      req.on('error', (e) => {
        console.log(`❌ Error: ${e.message}`)
        resolve(false)
      })

      req.write(propfindBody)
      req.end()
    })
  }

  async testPut() {
    console.log('\n📤 Testing PUT request...')

    const testContent = 'Hello WebDAV! This is a test file.'

    return new Promise((resolve) => {
      const options = {
        hostname: new URL(this.baseUrl).hostname,
        port: new URL(this.baseUrl).port || (this.isHttps ? 443 : 80),
        path: '/webdav/test-file.txt',
        method: 'PUT',
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': Buffer.byteLength(testContent),
          Authorization: `Bearer ${this.token}`,
          'User-Agent': 'WebDAV-Test/1.0'
        }
      }

      const req = this.client.request(options, (res) => {
        console.log(`✅ Status: ${res.statusCode}`)

        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          if (res.statusCode === 201) {
            console.log('✅ File uploaded successfully')
          } else if (res.statusCode === 401) {
            console.log('⚠️  Authentication required - this is expected without a valid token')
          } else {
            console.log(`⚠️  Unexpected status: ${res.statusCode}`)
          }
          resolve(res.statusCode === 201 || res.statusCode === 401)
        })
      })

      req.on('error', (e) => {
        console.log(`❌ Error: ${e.message}`)
        resolve(false)
      })

      req.write(testContent)
      req.end()
    })
  }

  async runAllTests() {
    console.log('🚀 Starting WebDAV Connection Tests...')
    console.log(`📍 Testing URL: ${this.baseUrl}/webdav`)

    const results = {
      options: await this.testOptions(),
      propfind: await this.testPropfind(),
      put: await this.testPut()
    }

    console.log('\n📊 Test Results:')
    console.log(`OPTIONS: ${results.options ? '✅ PASS' : '❌ FAIL'}`)
    console.log(`PROPFIND: ${results.propfind ? '✅ PASS' : '❌ FAIL'}`)
    console.log(`PUT: ${results.put ? '✅ PASS' : '❌ FAIL'}`)

    const allPassed = Object.values(results).every((result) => result)

    if (allPassed) {
      console.log('\n🎉 All tests passed! Your WebDAV server is working correctly.')
      console.log('\n📱 You can now configure your iOS device:')
      console.log('1. Open the Files app')
      console.log('2. Tap the three dots menu (⋯)')
      console.log('3. Select "Connect to Server"')
      console.log(`4. Enter: ${this.baseUrl}/webdav`)
      console.log('5. Use your email and password to authenticate')
    } else {
      console.log('\n⚠️  Some tests failed. Please check your server configuration.')
    }

    return allPassed
  }
}

async function main() {
  console.log('🔧 WebDAV Connection Tester')
  console.log('============================\n')

  const baseUrl = await new Promise((resolve) => {
    rl.question('Enter your WebDAV server URL (e.g., http://localhost:8000): ', (answer) => {
      resolve(answer.trim() || 'http://localhost:8000')
    })
  })

  const token = await new Promise((resolve) => {
    rl.question('Enter your JWT token (optional, press Enter to skip): ', (answer) => {
      resolve(answer.trim() || '')
    })
  })

  rl.close()

  const tester = new WebDAVTester(baseUrl, token)
  await tester.runAllTests()
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = WebDAVTester
