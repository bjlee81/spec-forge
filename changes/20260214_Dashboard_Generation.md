# Change Document: Dashboard Generation Pipeline

- **Date:** 2026-02-14
- **Status:** Pending

## User Request
"service Main (user)" 대시보드 페이지만 우선 진행. 결과물은 별도 폴더에 저장.

## Proposed Changes
- **packages/figma-reader**:
  - `extract-node.ts`: 특정 Node ID의 데이터를 상세 조회하여 JSON으로 저장하는 스크립트 추가.
- **pipeline**:
  - 수동 파이프라인 실행을 위한 단계별 스크립트 작성 예정 (Extract -> Parse -> Generate).

## Reasoning
전체 파일을 처리하기엔 너무 크고 복잡함. 타겟 노드(`9068:200269`)만 추출하여 파이프라인을 검증하는 것이 효율적.

## Impact Analysis
- `figma-reader` 패키지에 유틸리티 스크립트 추가.
- `generated/` 디렉토리에 결과물 생성.

## Verification Steps
1. `extract-node.ts` 실행 -> `figma-node.json` 생성 확인.
2. (이후 단계) 파서 및 생성기 연결.

## Status
Pending
