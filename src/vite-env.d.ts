/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * 공유(초대 링크) 프리뷰에 노출될 OG 이미지의 공개 https 절대 URL이에요.
   * 비우면 배포 오리진 기준 `/og-cover.png`(public/, 1200×600)를 자동으로 써요.
   * 콘솔 등록 후 CDN/배포 URL을 발급받으면 여기에 주입해 코드 수정 없이 교체해요.
   */
  readonly VITE_OG_IMAGE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}
