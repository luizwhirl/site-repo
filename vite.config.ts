import { defineConfig } from 'vite'

export default defineConfig({
  // Caso vá fazer deploy em subpasta, ajuste a base. Ex: '/meu-repo/'
  base: '/', 
  server: {
    port: 3000
  }
})