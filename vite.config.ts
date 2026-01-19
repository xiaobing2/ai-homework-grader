import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 将 node_modules 中的依赖单独打包
          if (id.includes('node_modules')) {
            // Element Plus 及其样式单独打包（体积最大）
            if (id.includes('element-plus')) {
              return 'element-plus'
            }
            // Vue 核心库单独打包
            if (id.includes('vue')) {
              return 'vue-vendor'
            }
            // 其他第三方库打包到一起
            return 'vendor'
          }
        },
      },
    },
    // 提高 chunk 大小警告阈值到 1000KB
    chunkSizeWarningLimit: 1000,
    // 启用 CSS 代码分割
    cssCodeSplit: true,
  },
})
