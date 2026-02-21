# 20260221_Upgrade_Spring_Boot_Version

- **Date:** 2026-02-21
- **User Request:** backend 는 spring boot 로 되어있는데 이게 4.0.2 가 최근 안정화버전이니까 변경해줘.
- **Proposed Changes:** 
  - `packages/backend-cli/src/spring-initializr.ts` (또는 관련 파일)에서 Spring Boot 버전 설정을 `3.5.10` 등에서 `4.0.2`로 변경.
  - `README.md` 내의 Spring Boot 버전에 대한 참조를 `3.5.10`에서 `4.0.2`로 업데이트.
  - TDD 사이클에 맞춰 관련 테스트 코드를 수정한 후 기능 구현 후 통과 확인.
- **Reasoning:** 사용자 요청에 따라 최신 안정화 버전인 Spring Boot 4.0.2를 반영하여 코드가 생성될 수 있도록 함.
- **Impact Analysis:** Spring Initializr에서 패키지를 다운로드하거나, `build.gradle` 생성 시 참조되는 스프링 부트 버전이 변경되며 4.0.2 기반의 의존성으로 백엔드가 구성됨.
- **Verification Steps:** `npm test --workspace=packages/backend-cli` 테스트 실행 시 `4.0.2`로 정상적으로 버전이 주입되었는지 확인하고, 전체 파이프라인(`run-all.sh`)이 빌드 에러 없이 마무리되는지 검증.
- **Status:** Verified
