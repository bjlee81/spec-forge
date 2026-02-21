# Changes: Apply Naming Conventions to Code Generation Pipeline

**Date:** 2026-02-14
**User Request:** "변수, 클래스, api path 등의 네이밍이 너무 엉망이야. generated 전에 관련 지침이 프로젝트에 추가되는게 좋을 것 같아."

## User Request
The user identified that the generated code (classes, variables, API paths) has poor naming conventions (e.g., generic names, raw Figma names with special characters). They requested establishing and applying naming guidelines.

## Proposed Changes
1.  **Documentation**: Create `docs/NAMING_CONVENTIONS.md`.
2.  **`design-parser` Update**:
    -   Update `inferModelName` to strictly output `PascalCase`.
    -   Update `collectInputFields` to sanitize and convert field names to `camelCase`.
    -   Ensure `DesignIR` carries clean names.
3.  **`spec-gen` Update**:
    -   Update `OpenAPIGenerator` to generate `kebab-case` paths from `PascalCase` model names.
    -   Update `SchemaGenerator` to ensure `snake_case` table/column names (already largely handled but verify).
4.  **`backend-cli` Update**:
    -   Verify `EntityGenerator` and others respect the inputs from `spec-gen`.

## Impact Analysis
-   **Generated Code**: Will be more idiomatic (Java standard, REST standard).
-   **Backward Compatibility**: Re-running generation on old `figma-node.json` will produce different file signatures. This is acceptable as we are in the development phase.

## Verification Steps
1.  Run `run-parser.ts` on `generated/service-main/figma-node.json`.
2.  Inspect `design-ir.json` for `PascalCase` models and `camelCase` fields.
3.  Run `run-spec-gen.ts`.
4.  Inspect `openapi.json` for `/service-main-users` paths.
5.  Inspect `schema.json` for `service_main_users` table.
6.  Run `generate-manual.ts`.
7.  Check `serviceMainuser.java` for proper class/field names.
