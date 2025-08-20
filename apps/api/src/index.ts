import 'reflect-metadata'
import express from 'express'
import cors from 'cors'
import { useExpressServer } from 'routing-controllers'
import FilesController from './controllers/files.controller'
import AuthController from './controllers/auth.controller'
import UsersController from './controllers/users.controller'
import NotesController from './controllers/notes.controller'
import PhotosController from './controllers/photos.controller'
import WorkspaceController from './controllers/workspace.controller'
import WorkspaceInviteController from './controllers/workspaceInvite.controller'
import AdminController from './controllers/admin.controller'
import { webdavMiddleware } from './middleware/webdav'

const app = express()
const PORT = process.env.PORT || 4000

app.use(
  cors({
    origin: (origin, callback) => callback(null, origin),
    credentials: true
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Add WebDAV middleware before routing-controllers
app.use(webdavMiddleware)

useExpressServer(app, {
  routePrefix: '/api',
  controllers: [
    FilesController,
    AuthController,
    UsersController,
    NotesController,
    PhotosController,
    WorkspaceController,
    WorkspaceInviteController,
    AdminController
  ]
})

// Catch-all error handler for consistent JSON errors
app.use((err, req, res, next) => {
  res
    .status(err.status || 500)
    .json({ success: false, data: null, error: err.message || 'Internal Server Error' })
})

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
  })
}

export default app
