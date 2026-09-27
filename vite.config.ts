import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const configuredBase = process.env.VITE_BASE_PATH
const base = configuredBase ? (configuredBase.endsWith('/') ? configuredBase : `${configuredBase}/`) : '/'

export default defineConfig({
  base,
  plugins: [react()],
})
