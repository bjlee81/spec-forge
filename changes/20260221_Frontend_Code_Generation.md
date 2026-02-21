# 20260221_Frontend_Code_Generation

- **Date:** 2026-02-21
- **User Request:** 지금 프로젝트는 figma 를 읽어서 backend 소스를 생성하는데, figma 에 대응하는 프론트엔드 소스도 생성하는게 있어야 할 것 같아. 기능만 확인하면 되니까, 고급진 프론트엔드까지 필요하지는 않고 backend 에 대응하는 기능을 확인할 수 있는 정도면 돼.
- **Proposed Changes:** 
  - `packages/frontend-gen` 패키지를 구현하여 디자인 명세(IR) 혹은 생성된 OpenAPI/schema 명세로부터 프론트엔드 코드를 생성 (React 또는 바닐라 HTML/JS 등).
  - 프로젝트 루트의 `run-all.sh` 스크립트에 프론트엔드 생성 단계를 추가.
- **Reasoning:** 백엔드 기능이 정상적으로 구현되었는지 확인하기 위해 빠르게 연동해볼 수 있는 프론트엔드 클라이언트가 필요함.
- **Impact Analysis:** 새로운 생성 파이프라인이 추가되며 기존 백엔드/명세 추출 코드는 영향을 받지 않음.
- **Verification Steps:** `run-all.sh` 실행 시 프론트엔드 애플리케이션 번들이 생성되고, 브라우저에서 띄웠을 때 백엔드 API와 통신하는지 확인.
- **Status:** Verified
