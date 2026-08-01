import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

<<<<<<< HEAD
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist' },
=======
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Relative paths ke liye
  build: {
    outDir: 'dist',
  },
>>>>>>> 186ab02048f8357d6a7ff5ffc9a9d26ea2f4c651
  server: {
    port: 5173,
    proxy: {
      '/api': {
<<<<<<< HEAD
        target: 'http://127.0.0.1:8000',
=======
        target: 'http://127.0.0.1:8000', // Ye sirf local testing ke liye hai
>>>>>>> 186ab02048f8357d6a7ff5ffc9a9d26ea2f4c651
        changeOrigin: true,
      },
    },
  },
<<<<<<< HEAD
})
=======
})
>>>>>>> 186ab02048f8357d6a7ff5ffc9a9d26ea2f4c651
