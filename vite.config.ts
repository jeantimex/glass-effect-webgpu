import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/glass-effect-webgpu/' : '/',
  server: {
    port: 3000,
    open: true
  }
}))
