import express from 'express'
import apiRouter from './routes'

const app = express()
const PORT = process.env.PORT || 8000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api', apiRouter)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
