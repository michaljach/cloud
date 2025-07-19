import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import apiRouter from './routes'

const app = express()
const PORT = process.env.PORT || 8000

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api', apiRouter)

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
