# 20260221_Fix_Swagger_Dependency

- **Date:** 2026-02-21
- **User Request:** `./gradlew bootRun` 실행 시 `package io.swagger.v3.oas.models does not exist` 컴파일 에러 발생
- **Proposed Changes:** 
  - `packages/backend-cli/src/scaffolder.ts`에서 Spring Initializr가 반환하는 ZIP 압축 해제 이후 수동으로 `build.gradle`에 `springdoc-openapi-starter-webmvc-ui` 의존성을 추가하도록 로직 보완.
- **Reasoning:** `start.spring.io` API는 기본적으로 `springdoc-openapi`를 의존성 카탈로그에 자동 포함해주지 않아, Swagger 설정을 사용하는 템플릿 코드 생성 시 컴파일 불가 이슈가 있었음.
- **Impact Analysis:** 생성된 백엔드 프로젝트가 완벽히 자립적으로 컴파일 및 실행(`bootRun`) 가능해짐. 기존의 Swagger 관련 의존성 누락 문제 해결.
- **Verification Steps:** `scaffolder.ts` 수정 후 `./run-all.sh` 재실행 및 해당 폴더 내 `./gradlew classes` (혹은 `bootRun`) 통과 여부 확인.
- **Status:** Verified
