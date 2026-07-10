import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // 실기기(샌드박스) 로컬 테스트용: 모든 인터페이스(0.0.0.0)에 바인딩해 같은 네트워크의
  // 기기에서 접속할 수 있게 해요. granite.config의 web.host는 vite bind에 관여하지 않아요.
  server: {
    host: true,
  },
});
