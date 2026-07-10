import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "snap-bingo",
  brand: {
    displayName: "찍고빙고", // 화면에 노출될 앱의 한글 이름으로 바꿔주세요.
    primaryColor: "#3182f6", // Toss Blue (appintoss-kit design-system primary token)
    // TODO: 콘솔에 600x600 PNG(모서리 둥글지 않은 정사각형, 불투명 배경) 로고를 업로드한 뒤
    // 발급되는 URL로 교체해주세요. 아래는 임시 목업 아이콘입니다.
    icon: "https://lh3.googleusercontent.com/aida-public/AB6AXuC9xDbFSAOy2WGA8syrG06HOAylN_GXj3wcPddesHP2Q2OufAiYrLEHEppxm2hmuGoxubHwMUOzF7O7A_RJp3wbPuzjJXk_brMOGO5VzR776C8q0zvnjAbNdBvraVcQA0LCy1LyxJd8X_JCdTjdr8sssRnZxFffirtQ0jsV7LrsrBPtL_0O__zNX6iHz_sHPFTr66CK8UATQlmlX64svmQlfvVts5t9Xf2TPAi15PY3KlTmxVVdJyRTbIZ8YLHhC9cpb1tq2iIK4TPf",
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
