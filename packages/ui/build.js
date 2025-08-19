#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Create dist directory
const distDir = path.join(__dirname, 'dist')
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true })
}

// Try different paths for tailwindcss binary and module
const binaryPaths = [
  path.join(__dirname, '../../node_modules/.bin/tailwindcss'), // Local development and Docker (root node_modules)
  path.join(__dirname, 'node_modules/.bin/tailwindcss') // Docker container (local package node_modules)
]

const modulePaths = [
  path.join(__dirname, '../../node_modules/@tailwindcss/cli/dist/index.mjs'), // Local development and Docker (root node_modules)
  path.join(__dirname, 'node_modules/@tailwindcss/cli/dist/index.mjs') // Docker container (local package node_modules)
]

let tailwindcssPath = null
let useNode = false

// First try binary paths
for (const p of binaryPaths) {
  if (fs.existsSync(p)) {
    tailwindcssPath = p
    break
  }
}

// If no binary found, try module paths
if (!tailwindcssPath) {
  for (const p of modulePaths) {
    if (fs.existsSync(p)) {
      tailwindcssPath = p
      useNode = true
      break
    }
  }
}

if (!tailwindcssPath) {
  console.error('Error: tailwindcss binary or module not found')
  console.error('Checked binary paths:', binaryPaths)
  console.error('Checked module paths:', modulePaths)
  console.error('Current directory:', __dirname)
  console.error('Directory contents:')
  try {
    console.error(
      'Root node_modules exists:',
      fs.existsSync(path.join(__dirname, '../../node_modules'))
    )
    console.error('Local node_modules exists:', fs.existsSync(path.join(__dirname, 'node_modules')))
    if (fs.existsSync(path.join(__dirname, '../../node_modules'))) {
      const rootNodeModules = path.join(__dirname, '../../node_modules')
      console.error('Root node_modules contents (first 10):')
      const items = fs.readdirSync(rootNodeModules).slice(0, 10)
      console.error(items)

      // Check if tailwindcss directory exists
      const tailwindDir = path.join(rootNodeModules, 'tailwindcss')
      const tailwindCliDir = path.join(rootNodeModules, '@tailwindcss')
      console.error('tailwindcss dir exists:', fs.existsSync(tailwindDir))
      console.error('@tailwindcss dir exists:', fs.existsSync(tailwindCliDir))

      if (fs.existsSync(tailwindCliDir)) {
        console.error('@tailwindcss contents:', fs.readdirSync(tailwindCliDir))
      }
    }
  } catch (error) {
    console.error('Error reading directories:', error.message)
  }
  process.exit(1)
}

// Run tailwindcss
const inputFile = path.join(__dirname, 'src/styles.css')
const outputFile = path.join(__dirname, 'dist/styles.css')

try {
  if (useNode) {
    execSync(`node ${tailwindcssPath} -i ${inputFile} -o ${outputFile}`, {
      stdio: 'inherit',
      cwd: __dirname
    })
  } else {
    execSync(`${tailwindcssPath} -i ${inputFile} -o ${outputFile}`, {
      stdio: 'inherit',
      cwd: __dirname
    })
  }
  console.log('Tailwind CSS build completed successfully')
} catch (error) {
  console.error('Error running tailwindcss:', error.message)
  process.exit(1)
}
