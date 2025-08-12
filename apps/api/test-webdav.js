const http = require('http')

// Test WebDAV OPTIONS request
function testWebDAVOptions() {
  const options = {
    hostname: 'localhost',
    port: 8000,
    path: '/webdav',
    method: 'OPTIONS',
    headers: {
      'User-Agent': 'WebDAV-Test/1.0'
    }
  }

  const req = http.request(options, (res) => {
    console.log('OPTIONS Response Status:', res.statusCode)
    console.log('DAV Header:', res.headers.dav)
    console.log('Allow Header:', res.headers.allow)
    console.log('MS-Author-Via Header:', res.headers['ms-author-via'])

    res.on('data', (chunk) => {
      console.log('Response Body:', chunk.toString())
    })
  })

  req.on('error', (e) => {
    console.error('OPTIONS Request Error:', e.message)
  })

  req.end()
}

// Test WebDAV PROPFIND request (will fail without auth, but should return proper error)
function testWebDAVPropfind() {
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

  const options = {
    hostname: 'localhost',
    port: 8000,
    path: '/webdav',
    method: 'PROPFIND',
    headers: {
      'Content-Type': 'application/xml',
      Depth: '0',
      'User-Agent': 'WebDAV-Test/1.0'
    }
  }

  const req = http.request(options, (res) => {
    console.log('\nPROPFIND Response Status:', res.statusCode)
    console.log('Content-Type:', res.headers['content-type'])

    let data = ''
    res.on('data', (chunk) => {
      data += chunk
    })

    res.on('end', () => {
      console.log('Response Body:', data)
    })
  })

  req.on('error', (e) => {
    console.error('PROPFIND Request Error:', e.message)
  })

  req.write(propfindBody)
  req.end()
}

console.log('Testing WebDAV Implementation...\n')

// Test OPTIONS
console.log('=== Testing OPTIONS ===')
testWebDAVOptions()

// Wait a bit then test PROPFIND
setTimeout(() => {
  console.log('\n=== Testing PROPFIND ===')
  testWebDAVPropfind()
}, 1000)
