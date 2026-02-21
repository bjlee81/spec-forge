# 20260221_Implement_Figma_CSS

- **Date:** 2026-02-21
- **User Request:** 생성된 html 의 css 가 엉멍이야. 피그마 기획에 맞춰서 생성되어야 하지 않아?
- **Proposed Changes:** 
  - `packages/design-parser/src/types.ts` 의 `UIElement` 인터페이스에 `styles?: Record<string, string>` 속성 추가.
  - `packages/design-parser/src/parser.ts` 의 파싱 로직에서 FigmaNode의 위치, 크기, 색상, 폰트 정보를 CSS 어트리뷰트로 변환하여 `styles` 속성에 매핑.
  - `packages/frontend-gen/src/generator.ts` 에서 화면 구성 요소 그릴 때, `styles` 맵이 존재하면 `style="..."` 형태로 HTML에 주입.
- **Reasoning:** 현재는 HTML 골격구조만 만들기 때문에 Figma 캔버스의 모습을 반영하지 않음. 위치, 색상, 크기 등을 인라인 스타일로 주입해 주면 훨씬 더 Figma 컴포넌트와 유사한 모습으로 프리뷰 시연이 가능해짐.
- **Impact Analysis:** 프론트엔드 HTML의 `style` 태그가 무거워지겠지만 시각적으로 실제 기획서와 훨씬 더 가까운 결과물이 나옴. 파생 컴포넌트들의 외관 퀄리티가 상승.
- **Verification Steps:** `run-all.sh` 파이프라인 가동 후 `generated/service-main/frontend` 폴더 아래 HTML 파일들의 노드 엘리먼트들이 `style="width: ...; height: ...; background-color: ...;"` 등의 속성을 잘 달고 나오는지 확인 및 브라우저에서 렌더링 검사.
- **Status:** Verified
