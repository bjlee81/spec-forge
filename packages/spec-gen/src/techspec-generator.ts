import type { DesignIR } from '@figma-codegen/design-parser';
import type { OpenAPIDocument } from './openapi-generator.js';
import type { DatabaseSchema } from './schema-generator.js';

/**
 * 기술 구현 명세서 (Tech Spec Document) 를 Markdown으로 생성합니다.
 */
export class TechSpecGenerator {
    generate(
        ir: DesignIR,
        openapi: OpenAPIDocument,
        dbSchema: DatabaseSchema,
    ): string {
        return `# ${ir.projectName} - Technical Specification

## 1. Overview

- **프로젝트명:** ${ir.projectName}
- **화면 수:** ${ir.screens.length}
- **데이터 모델 수:** ${ir.dataModels.length}
- **API 엔드포인트 수:** ${Object.keys(openapi.paths).length * 2} (예상)

## 2. Screen Inventory

| # | 화면명 | 유형 | 요소 수 |
|---|--------|------|---------|
${ir.screens.map((s, i) => `| ${i + 1} | ${s.name} | ${s.screenType} | ${s.elements.length} |`).join('\n')}

## 3. Data Models

${ir.dataModels.map(m => `### ${m.name}

${m.description || ''}

| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
${m.fields.map(f => `| ${f.name} | ${f.type} | ${f.required ? '✅' : '❌'} | ${f.description || '-'} |`).join('\n')}

**관계:**
${m.relations.length > 0 ? m.relations.map(r => `- ${r.type} → ${r.targetModel}`).join('\n') : '- 없음'}
`).join('\n')}

## 4. API Endpoints

${Object.entries(openapi.paths).map(([path, methods]) =>
            Object.entries(methods).map(([method, op]) =>
                `- \`${method.toUpperCase()} ${path}\` — ${op.summary}`
            ).join('\n')
        ).join('\n')}

## 5. Database Schema

\`\`\`sql
${dbSchema.sql}
\`\`\`

## 6. Architecture Decisions

### 6.1 인증
- JWT 기반 Bearer 토큰 인증 권장
- 로그인 화면 감지 시 자동으로 인증 엔드포인트 포함

### 6.2 API 설계 원칙
- RESTful CRUD 패턴 적용
- JSON request/response
- 페이지네이션: offset-based (page, size 파라미터)
- 에러 응답: RFC 7807 Problem Details 형식

### 6.3 비기능 요구사항
- 응답 시간: 95th percentile < 200ms
- 동시 접속: 최소 100명
- 데이터 백업: 일 1회 자동 백업 권장

## 7. Dependencies

| 구분 | 패키지 | 용도 |
|------|--------|------|
| Runtime | 프레임워크별 상이 | Web Framework |
| Database | ORM 라이브러리 | DB 연동 |
| Auth | JWT 라이브러리 | 인증/인가 |
| Validation | 입력 검증 | Request 유효성 |
| API Docs | Swagger UI | API 문서화 |

---

*이 문서는 SpecForge에 의해 자동 생성되었습니다.*
`;
    }
}
