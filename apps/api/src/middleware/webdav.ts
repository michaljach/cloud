import { Request, Response, NextFunction } from 'express'
import { authenticate } from './authenticate'
import * as xml2js from 'xml2js'
import fs from 'fs'
import path from 'path'
import {
  getStorageDirForContext,
  listFolderContentsWithMetadataForContext
} from '../utils/storageUtils'

const PERSONAL_WORKSPACE_ID = 'personal'

interface WebDAVResponse {
  href: string
  propstat: {
    prop: {
      resourcetype?: { collection?: {} }
      getcontentlength?: string
      getlastmodified?: string
      getcontenttype?: string
      displayname?: string
    }
    status: string
  }[]
}

export function webdavMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only handle WebDAV requests
  if (!req.path.startsWith('/webdav')) {
    return next()
  }

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.setHeader('DAV', '1, 2')
    res.setHeader(
      'Allow',
      'OPTIONS, GET, HEAD, POST, DELETE, TRACE, COPY, MOVE, MKCOL, PUT, PROPFIND, PROPPATCH, LOCK, UNLOCK'
    )
    res.setHeader('MS-Author-Via', 'DAV')
    return res.status(200).send('')
  }

  // Handle authentication for WebDAV requests
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send(generateErrorResponse('401 Unauthorized'))
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix

  // For now, we'll skip detailed token validation in WebDAV middleware
  // and let the individual handlers deal with authentication
  // In production, you should validate the JWT token here

  const user = { id: 'temp-user' } // Placeholder - implement proper JWT validation

  // Extract path from URL
  const requestPath = req.path.replace('/webdav', '') || '/'
  const workspaceId = (req.query.workspaceId as string) || PERSONAL_WORKSPACE_ID

  try {
    switch (req.method) {
      case 'PROPFIND':
        return handlePropfind(req, res, user, requestPath, workspaceId)
      case 'GET':
        return handleGet(req, res, user, requestPath, workspaceId)
      case 'PUT':
        return handlePut(req, res, user, requestPath, workspaceId)
      case 'DELETE':
        return handleDelete(req, res, user, requestPath, workspaceId)
      case 'MKCOL':
        return handleMkcol(req, res, user, requestPath, workspaceId)
      case 'COPY':
        return handleCopy(req, res, user, requestPath, workspaceId)
      case 'MOVE':
        return handleMove(req, res, user, requestPath, workspaceId)
      default:
        return res.status(405).send(generateErrorResponse('405 Method Not Allowed'))
    }
  } catch (error) {
    console.error('WebDAV error:', error)
    return res.status(500).send(generateErrorResponse('500 Internal Server Error'))
  }
}

function handlePropfind(
  req: Request,
  res: Response,
  user: any,
  requestPath: string,
  workspaceId: string
) {
  let depth = req.headers.depth || '0'
  if (depth === 'infinity') depth = '1' // Limit depth for security

  const storageDir = getStorageDirForContext(user.id, workspaceId, 'files')
  const targetPath = requestPath === '/' ? storageDir : path.join(storageDir, requestPath)

  if (!fs.existsSync(targetPath)) {
    return res.status(404).send(generateErrorResponse('404 Not Found'))
  }

  const responses: WebDAVResponse[] = []
  const stat = fs.statSync(targetPath)

  // Add the requested resource
  responses.push(createPropfindResponse(requestPath, stat, workspaceId))

  // If depth > 0 and it's a directory, add children
  if (parseInt(depth as string) > 0 && stat.isDirectory()) {
    const items = listFolderContentsWithMetadataForContext(
      user.id,
      workspaceId,
      'files',
      requestPath === '/' ? '' : requestPath
    )

    for (const item of items) {
      const itemPath = requestPath === '/' ? `/${item.name}` : `${requestPath}/${item.name}`
      const itemFullPath = path.join(
        storageDir,
        requestPath === '/' ? item.name : path.join(requestPath, item.name)
      )

      if (fs.existsSync(itemFullPath)) {
        const itemStat = fs.statSync(itemFullPath)
        responses.push(createPropfindResponse(itemPath, itemStat, workspaceId))
      }
    }
  }

  const xmlResponse = generatePropfindResponse(responses)
  res.setHeader('Content-Type', 'application/xml; charset="utf-8"')
  return res.send(xmlResponse)
}

function handleGet(
  req: Request,
  res: Response,
  user: any,
  requestPath: string,
  workspaceId: string
) {
  const storageDir = getStorageDirForContext(user.id, workspaceId, 'files')
  const targetPath = requestPath === '/' ? storageDir : path.join(storageDir, requestPath)

  if (!fs.existsSync(targetPath)) {
    return res.status(404).send(generateErrorResponse('404 Not Found'))
  }

  const stat = fs.statSync(targetPath)

  if (stat.isDirectory()) {
    return res.status(405).send(generateErrorResponse('405 Method Not Allowed'))
  }

  // Set appropriate headers
  res.setHeader('Content-Length', stat.size.toString())
  res.setHeader('Last-Modified', stat.mtime.toUTCString())
  res.setHeader('Content-Type', getMimeType(requestPath))

  // Stream the file
  const fileStream = fs.createReadStream(targetPath)
  return fileStream.pipe(res)
}

function handlePut(
  req: Request,
  res: Response,
  user: any,
  requestPath: string,
  workspaceId: string
) {
  const storageDir = getStorageDirForContext(user.id, workspaceId, 'files')
  const targetPath = requestPath === '/' ? storageDir : path.join(storageDir, requestPath)

  // Ensure the directory exists
  const dir = path.dirname(targetPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  // Check if target is a directory
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
    return res.status(409).send(generateErrorResponse('409 Conflict'))
  }

  // Write the file
  const writeStream = fs.createWriteStream(targetPath)
  req.pipe(writeStream)

  writeStream.on('finish', () => {
    res.status(201).send('')
  })

  writeStream.on('error', (error) => {
    res.status(500).send(generateErrorResponse('500 Internal Server Error'))
  })
}

function handleDelete(
  req: Request,
  res: Response,
  user: any,
  requestPath: string,
  workspaceId: string
) {
  const storageDir = getStorageDirForContext(user.id, workspaceId, 'files')
  const targetPath = requestPath === '/' ? storageDir : path.join(storageDir, requestPath)

  if (!fs.existsSync(targetPath)) {
    return res.status(404).send(generateErrorResponse('404 Not Found'))
  }

  const stat = fs.statSync(targetPath)

  if (stat.isDirectory()) {
    deleteDirectoryRecursive(targetPath)
  } else {
    fs.unlinkSync(targetPath)
  }

  return res.status(204).send('')
}

function handleMkcol(
  req: Request,
  res: Response,
  user: any,
  requestPath: string,
  workspaceId: string
) {
  const storageDir = getStorageDirForContext(user.id, workspaceId, 'files')
  const targetPath = requestPath === '/' ? storageDir : path.join(storageDir, requestPath)

  if (fs.existsSync(targetPath)) {
    return res.status(405).send(generateErrorResponse('405 Method Not Allowed'))
  }

  // Ensure parent directory exists
  const parentDir = path.dirname(targetPath)
  if (!fs.existsSync(parentDir)) {
    return res.status(409).send(generateErrorResponse('409 Conflict'))
  }

  fs.mkdirSync(targetPath)
  return res.status(201).send('')
}

function handleCopy(
  req: Request,
  res: Response,
  user: any,
  requestPath: string,
  workspaceId: string
) {
  const destination = req.headers.destination as string

  if (!destination) {
    return res.status(400).send(generateErrorResponse('400 Bad Request'))
  }

  const storageDir = getStorageDirForContext(user.id, workspaceId, 'files')
  const sourceFullPath = requestPath === '/' ? storageDir : path.join(storageDir, requestPath)
  const destPath = destination.replace('/webdav', '')
  const destFullPath = destPath === '/' ? storageDir : path.join(storageDir, destPath)

  if (!fs.existsSync(sourceFullPath)) {
    return res.status(404).send(generateErrorResponse('404 Not Found'))
  }

  // Ensure destination directory exists
  const destDir = path.dirname(destFullPath)
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }

  const stat = fs.statSync(sourceFullPath)

  if (stat.isDirectory()) {
    copyDirectoryRecursive(sourceFullPath, destFullPath)
  } else {
    fs.copyFileSync(sourceFullPath, destFullPath)
  }

  return res.status(201).send('')
}

function handleMove(
  req: Request,
  res: Response,
  user: any,
  requestPath: string,
  workspaceId: string
) {
  const destination = req.headers.destination as string

  if (!destination) {
    return res.status(400).send(generateErrorResponse('400 Bad Request'))
  }

  const storageDir = getStorageDirForContext(user.id, workspaceId, 'files')
  const sourceFullPath = requestPath === '/' ? storageDir : path.join(storageDir, requestPath)
  const destPath = destination.replace('/webdav', '')
  const destFullPath = destPath === '/' ? storageDir : path.join(storageDir, destPath)

  if (!fs.existsSync(sourceFullPath)) {
    return res.status(404).send(generateErrorResponse('404 Not Found'))
  }

  // Ensure destination directory exists
  const destDir = path.dirname(destFullPath)
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }

  fs.renameSync(sourceFullPath, destFullPath)
  return res.status(201).send('')
}

function createPropfindResponse(href: string, stat: fs.Stats, workspaceId: string): WebDAVResponse {
  const isDirectory = stat.isDirectory()
  const hrefPath = href === '/' ? '/' : `/${href}`

  return {
    href: hrefPath,
    propstat: [
      {
        prop: {
          resourcetype: isDirectory ? { collection: {} } : undefined,
          getcontentlength: isDirectory ? undefined : stat.size.toString(),
          getlastmodified: stat.mtime.toUTCString(),
          getcontenttype: isDirectory ? 'httpd/unix-directory' : getMimeType(href),
          displayname: path.basename(href) || 'root'
        },
        status: 'HTTP/1.1 200 OK'
      }
    ]
  }
}

function generatePropfindResponse(responses: WebDAVResponse[]): string {
  const builder = new xml2js.Builder({
    rootName: 'multistatus'
  })

  const obj = {
    $: { 'xmlns:D': 'DAV:' },
    response: responses.map((response) => ({
      href: response.href,
      propstat: response.propstat.map((ps) => ({
        prop: {
          'D:resourcetype': ps.prop.resourcetype ? [{ 'D:collection': [{}] }] : [],
          'D:getcontentlength': ps.prop.getcontentlength ? [ps.prop.getcontentlength] : [],
          'D:getlastmodified': [ps.prop.getlastmodified],
          'D:getcontenttype': [ps.prop.getcontenttype],
          'D:displayname': [ps.prop.displayname]
        },
        status: [ps.status]
      }))
    }))
  }

  return builder.buildObject(obj)
}

function generateErrorResponse(status: string): string {
  const builder = new xml2js.Builder({
    rootName: 'error'
  })

  const obj = {
    $: { 'xmlns:D': 'DAV:' },
    'D:status': [status]
  }

  return builder.buildObject(obj)
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  const mimeTypes: { [key: string]: string } = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.xml': 'application/xml',
    '.zip': 'application/zip',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip'
  }

  return mimeTypes[ext] || 'application/octet-stream'
}

function deleteDirectoryRecursive(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file)
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteDirectoryRecursive(curPath)
      } else {
        fs.unlinkSync(curPath)
      }
    })
    fs.rmdirSync(dirPath)
  }
}

function copyDirectoryRecursive(source: string, destination: string): void {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true })
  }

  const files = fs.readdirSync(source)
  files.forEach((file) => {
    const sourcePath = path.join(source, file)
    const destPath = path.join(destination, file)

    if (fs.lstatSync(sourcePath).isDirectory()) {
      copyDirectoryRecursive(sourcePath, destPath)
    } else {
      fs.copyFileSync(sourcePath, destPath)
    }
  })
}
