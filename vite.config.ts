import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 将 Vue 核心库单独打包
          'vue-vendor': ['vue'],
          // 将 Element Plus 单独打包（体积较大）
          'element-plus': ['element-plus'],
          // 将 Element Plus 图标单独打包
          'element-icons': ['@element-plus/icons-vue'],
        },
      },
    },
    // 提高 chunk 大小警告阈值到 1000KB
    chunkSizeWarningLimit: 1000,
  },
})
