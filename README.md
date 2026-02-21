# SpecForge (Formely FigmaBackendCodeGen)

**SpecForge**는 다양한 기획/디자인 명세(Design Spec)에서 실행 가능한 백엔드 코드를 자동으로 생성하는 통합 파이프라인 엔진입니다. 현재는 **Figma**를 입력 소스로 지원하며, 추후 다양한 입력(PRD, 타 디자인 툴)으로 확장될 예정입니다.

## 🚀 주요 기능
- **Figma 추출**: Figma API를 통해 노드 데이터를 직접 추출합니다.
- **스마트 파싱**: 데이터 모델, 필드, 화면 유형(대시보드, 목록, 폼)을 추론합니다.
- **네이밍 컨벤션**: Figma 이름을 자동으로 변환하여 코드 표준을 준수합니다.
  - 클래스: `PascalCase` (예: `MainDashboard`)
  - 필드: `camelCase` (예: `textArea`)
- **명세 생성**: OpenAPI 3.0 및 SQL 스키마를 생성합니다.
- **코드 생성**: 실행 가능한 Spring Boot 4.0.2 애플리케이션을 생성합니다.

## 📋 사전 요구사항
- **Node.js**: v20 이상
- **Java**: JDK 17 이상
- **Figma Access Token**: [여기서 발급](https://www.figma.com/developers/api#access-tokens)
- **Figma File Key**: Figma 파일의 ID (URL에서 확인 가능: `figma.com/file/FILE_KEY/...`)

## 🛠️ 설치 방법

1.  **리포지토리 클론**:
    ```bash
    git clone <repository-url>
    cd spec-forge
    ```

2.  **의존성 설치**:
    ```bash
    npm install
    ```

3.  **환경 설정**:
    `.env.example` 파일을 복사하여 `.env`를 생성하고 토큰 정보를 입력하세요.
    ```bash
    cp .env.example .env
    ```
    `.env` 파일 편집:
    ```ini
    FIGMA_ACCESS_TOKEN=your_token_here
    TEST_FIGMA_FILE_KEY=your_file_key_here
    ```

## 🏃‍♂️ 사용 방법

### 빠른 시작 (원클릭 스크립트)
"service Main" 대시보드 생성을 위한 전체 파이프라인을 실행하는 스크립트가 제공됩니다.

```bash
./run-all.sh
```
*참고: 실행 권한이 없는 경우 `chmod +x run-all.sh`를 먼저 실행하세요.*

### 수동 실행 단계
각 단계를 개별적으로 실행하려면 다음 명령어를 사용하세요:

1.  **Figma 데이터 추출**:
    ```bash
    # 스크립트에 설정된 특정 노드를 추출합니다 (기본값: 'service > Main (user)')
    npx tsx packages/figma-reader/src/extract-node.ts
    ```

2.  **디자인 파싱 (IR 생성)**:
    ```bash
    npm run build --workspace=packages/design-parser
    npx tsx packages/design-parser/src/run-parser.ts \
      "generated/service-main/figma-node.json" \
      "generated/service-main/design-ir.json"
    ```

3.  **명세 생성 (OpenAPI, SQL)**:
    ```bash
    npm run build --workspace=packages/spec-gen
    npx tsx packages/spec-gen/src/run-spec-gen.ts \
      "generated/service-main/design-ir.json" \
      "generated/service-main/specs"
    ```

4.  **백엔드 코드 생성**:
    ```bash
    npm run build --workspace=packages/backend-cli
    npx tsx packages/backend-cli/src/generate-manual.ts \
      "generated/service-main/specs/openapi.json" \
      "generated/service-main/specs/schema.json" \
      "generated/service-main/backend"
    ```

## 📂 출력 결과물
모든 생성 파일은 `generated/service-main/` 디렉토리에 저장됩니다:
- `figma-node.json`: 원본 Figma 데이터
- `design-ir.json`: 파싱된 중간 표현 데이터
- `specs/`: OpenAPI (`openapi.json`) 및 SQL (`schema.json`) 명세
- `backend/`: 생성된 Spring Boot 프로젝트

## 🏗️ 생성된 백엔드 실행
생성된 백엔드 디렉토리로 이동하여 서버를 실행합니다:

```bash
cd generated/service-main/backend
./gradlew bootRun
```
서버는 `http://localhost:8080`에서 시작됩니다.
