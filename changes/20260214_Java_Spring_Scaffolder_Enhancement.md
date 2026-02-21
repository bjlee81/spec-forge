# Change Document: Java Spring Boot Scaffolder Enhancement

- **Date:** 2026-02-14
- **Status:** Implemented

## User Request
backend-cli의 Java/Spring Boot 스캐폴딩을 spring.io 기반 BP 참고하여 고도화. Spring Initializr 온라인 연동, Spring Boot 4.0.2 사용.

## Proposed Changes
- `spring-initializr.ts` — start.spring.io REST API 연동 클라이언트
- `java/entity-generator.ts` — OpenAPI 스키마 → JPA @Entity
- `java/repository-generator.ts` — JpaRepository 인터페이스
- `java/service-generator.ts` — Service interface + impl
- `java/controller-generator.ts` — @RestController CRUD
- `java/dto-generator.ts` — Request/Response DTO
- `java/config-generator.ts` — SwaggerConfig, WebConfig, GlobalExceptionHandler
- `java/migration-generator.ts` — Flyway SQL 스크립트
- `java/application-yml-generator.ts` — 프로파일별 yml
- `scaffolder.ts` 수정 — BackendConfig 확장 + scaffoldJava 통합

## Reasoning
현재 코드는 최소 파일만 생성. 실무에서 사용 가능한 수준의 프로젝트 스캐폴딩 필요.

## Impact Analysis
- backend-cli 패키지에만 영향
- 기존 Python/Node.js 스캐폴딩 변경 없음
- 기존 테스트 영향 없음

## Verification Steps
1. TDD로 각 generator 테스트 작성 후 구현 (Complete)
2. 전체 scaffoldJava 통합 테스트 (Unit test passed, manual pending)
3. `npx vitest run` 으로 전체 테스트 패스 확인 (Passed)

## Status
Implemented
