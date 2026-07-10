/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * 공유(초대 링크) 프리뷰에 노출될 OG 이미지의 공개 https 절대 URL이에요.
   * 비우면 배포 오리진 기준 `/og-cover.png`(public/, 1200×600)를 자동으로 써요.
   * 콘솔 등록 후 CDN/배포 URL을 발급받으면 여기에 주입해 코드 수정 없이 교체해요.
   */
  readonly VITE_OG_IMAGE_URL?: string;
  /**
   * "함께(공유 보드)" 기능용 Supabase 프로젝트 URL과 anon(공개) 키예요.
   * 둘 다 있으면 공유 기능이 켜지고, 없으면 솔로 전용으로 동작해요.
   * ⚠️ anon 키만 넣어요(공개용, RLS로 보호). service_role 키는 절대 넣지 마세요.
   */
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}
