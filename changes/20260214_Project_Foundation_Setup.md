# Change Document: Project Foundation Setup

- **Date:** 2026-02-14
- **Status:** Verified

## User Request
프로젝트 초기 설정 - pnpm monorepo 기반 TypeScript 프로젝트 구조 세팅

## Proposed Changes
- Root `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `vitest.config.ts` 생성
- 5개 패키지 (`figma-reader`, `design-parser`, `frontend-gen`, `spec-gen`, `backend-cli`) 스캐폴딩
- CLI orchestrator (`cli/`) 스캐폴딩
- 코드 생성용 `templates/` 디렉토리 구조 생성

## Reasoning
모든 모듈이 공유 타입과 설정을 사용할 수 있도록 monorepo 구조가 필요합니다.

## Impact Analysis
- 신규 프로젝트이므로 기존 코드에 대한 영향 없음

## Verification Steps
1. `pnpm install` 정상 실행
2. `pnpm build` 전체 빌드 정상
3. `pnpm test` 테스트 실행 가능
