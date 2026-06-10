/**
 * 인증(Authentication) 연동 인터페이스
 *
 * ─── 용도 ────────────────────────────────────────────────────────────
 * 현재 시스템은 로그인 없이 단일 사용자가 사용하는 구조이지만,
 * 향후 인증 시스템을 도입하면 다중 사용자 지원, 개인별 옷장 관리,
 * 소셜 로그인 등의 기능을 추가할 수 있다.
 * 이 인터페이스는 인증 기능 추가 시 구현해야 할 계약(contract)을 정의한다.
 *
 * ─── 향후 연동 방법 ──────────────────────────────────────────────────
 * 1. 이 인터페이스를 구현하는 클래스를 작성한다.
 *    예: `class SupabaseAuthService implements AuthInterface { ... }`
 *
 * 2. 고려 가능한 인증 서비스:
 *    - Supabase Auth (이메일/비밀번호, OAuth 소셜 로그인)
 *    - NextAuth.js (다양한 OAuth Provider 지원)
 *    - AWS Cognito (엔터프라이즈급 인증)
 *    - Firebase Authentication (간편 소셜 로그인)
 *    - Clerk (Next.js 최적화 인증 서비스)
 *
 * 3. 구현 시 세션 또는 JWT 토큰 기반으로 현재 로그인된 사용자를 식별하고,
 *    User 객체를 반환한다. 로그인되지 않은 경우 null을 반환한다.
 *
 * 4. 서비스 계층(ClosetService, FeedbackService 등)에서
 *    getCurrentUser()를 호출하여 사용자별 데이터를 분리한다.
 *    예: 옷장 아이템에 userId를 추가하여 사용자별 필터링
 *
 * 5. 환경 변수(예: AUTH_PROVIDER, AUTH_SECRET)로
 *    인증 제공자와 시크릿을 설정한다.
 *
 * ─── 주의사항 ────────────────────────────────────────────────────────
 * - 이 모듈은 독립적으로 존재하며, 제거해도 핵심 빌드에 영향을 주지 않는다.
 * - MVP 단계에서는 이 인터페이스를 구현하지 않으며,
 *   모든 데이터는 단일 사용자 기준으로 저장/조회된다.
 * - 인증 도입 시 DB 스키마에 userId 컬럼을 추가하고,
 *   기존 데이터 마이그레이션 계획도 함께 수립해야 한다.
 */

/**
 * 인증된 사용자 정보
 *
 * 로그인된 사용자의 기본 프로필 정보를 담는다.
 * 인증 제공자에 따라 추가 필드를 확장할 수 있다.
 */
export interface User {
  /** 사용자 고유 식별자 */
  id: string;
  /** 사용자 이메일 주소 */
  email: string;
  /** 사용자 표시 이름 (닉네임 또는 실명) */
  name: string | null;
  /** 프로필 이미지 URL (소셜 로그인 시 제공) */
  avatarUrl: string | null;
  /** 계정 생성 일시 */
  createdAt: Date;
}

/**
 * 인증 인터페이스
 *
 * 현재 세션의 로그인 상태를 확인하고 사용자 정보를 반환한다.
 */
export interface AuthInterface {
  /**
   * 현재 로그인된 사용자 정보를 반환한다.
   *
   * @returns 로그인된 사용자 객체, 또는 비로그인 상태이면 null
   *
   * @example
   * // 향후 구현 예시:
   * // const user = await authService.getCurrentUser();
   * // if (user) {
   * //   // 로그인 상태 — 사용자별 옷장 데이터 조회
   * //   const items = await closetService.getItems({ userId: user.id });
   * // } else {
   * //   // 비로그인 상태 — 로그인 페이지로 리다이렉트
   * //   redirect('/login');
   * // }
   */
  getCurrentUser(): Promise<User | null>;
}
