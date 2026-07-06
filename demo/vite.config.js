import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// sdk를 상대 경로(../../sdk/src)로 import 하므로 프로젝트 루트 밖 파일 접근을 허용한다.
// @vitejs/plugin-react가 sdk의 .jsx 파일을 트랜스파일한다.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    fs: {
      allow: ['..'],
    },
  },
})
