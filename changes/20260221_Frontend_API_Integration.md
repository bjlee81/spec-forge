# 20260221_Frontend_API_Integration

- **Date:** 2026-02-21
- **User Request:** 프론트엔드에서 작성된 코드가 백엔드에서 작성되는 코드와 api 로 연결성이 있어야 하는데 그렇게 구성이 돼?
- **Proposed Changes:** 
  - `packages/frontend-gen/src/generator.ts`에서 생성하는 JavaScript 코드에 백엔드 API (`http://localhost:8080/api/모델명`)와 통신하는 `fetch` 기반의 CRUD 함수를 추가.
  - 화면(Screen)의 요소(예: 목록, 폼 등록)에 이벤트 리스너를 붙여 실제 백엔드 API를 호출하도록 스크립트 수정.
  - TDD 정책에 따라 `generator.test.ts`에 API 호출 코드가 생성되는지 검증하는 실패하는 테스트를 먼저 추가.
- **Reasoning:** 현재 생성된 프론트엔드는 Mock 데이터만 콘솔에 찍을 뿐 백엔드와의 실질적인 연결 고리가 없음. 생성된 백엔드 코드가 동작하는지 브라우저에서 직접 확인할 수 있도록 API 연동 코드를 생성해야 함.
- **Impact Analysis:** 프론트엔드 생성 결과물의 JS (`app.js` 또는 각 화면별 script)가 고도화되며 백엔드가 실행 중일 때 브라우저에서 네트워크 요청을 보내게 됨.
- **Verification Steps:** `run-all.sh` 실행 후 나오는 `app.js` 코드를 열어 `fetch('http://localhost:8080/api/...')`가 포함되어 있는지, 컴포넌트 이벤트 리스너와 연결되어 있는지 확인.
- **Status:** Verified
