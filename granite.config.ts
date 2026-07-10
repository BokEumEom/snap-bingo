import { defineConfig } from "@apps-in-toss/web-framework/config";
import { APP_ICON } from "./src/data";

export default defineConfig({
  appName: "snap-bingo",
  brand: {
    displayName: "찍고빙고", // 화면에 노출될 앱의 한글 이름으로 바꿔주세요.
    primaryColor: "#3182f6", // Toss Blue (appintoss-kit design-system primary token)
    // 앱 실제 아이콘 아트(public/image_10.png)를 data.ts의 APP_ICON으로 단일 소스 참조해요.
    // TODO: 콘솔 제출 시 이 아트를 600x600 PNG(정사각형, 불투명 배경)로 내보내 업로드하세요.
    icon: APP_ICON,
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite dev",
      build: "vite build",
    },
  },
  permissions: [],
  outdir: "dist",
});
