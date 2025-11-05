import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // server: {
    
  // },
    server: {
    host: true, // listens on all network interfaces
    port: 5173, // optional, default 5173
  },
})
