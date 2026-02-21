# Change Request: Establishing Naming Guidelines

**Date:** 2026-02-14
**User Request:** The generated code (variables, classes, API paths) has messy naming. Guidelines should be added to the project before generation.

## Proposed Changes
1.  **Documentation:** Create `docs/NAMING_CONVENTIONS.md` defining strict rules for:
    *   Java Classes (PascalCase, semantic)
    *   Fields/Variables (camelCase, semantic, no generic names like `text_area_2`)
    *   API Paths (kebab-case, clean resource names)
    *   Database Tables/Columns (snake_case)
2.  **Parser Update:** Modify `design-parser` to:
    *   Implement a "Semantic Naming" strategy (potentially using a dictionary or heuristic mapping for now, replacing crude sanitization).
    *   Better handling of Figma special characters to cleaner API paths (e.g., convert `>` to `-` or `/`).
3.  **Backend CLI Update:** Ensure the scaffolder respects these conventions when generating Spring Boot code.

## Reasoning
The current parser naively sanitizes Figma layer names (e.g., `filter_2`, `text_area`), leading to unreadable and non-standard code. Explicit guidelines and improved parsing logic are needed to produce production-quality code.

## Impact Analysis
- **Positive:** Generated code will be readable, maintainable, and adhere to industry standards.
- **Risk:** Heuristics might still fail for very obscure Figma layer names; completely semantic naming might eventually require LLM integration (out of current scope, unless manually triggered).

## Verification Steps
1.  Review `docs/NAMING_CONVENTIONS.md`.
2.  Re-run `run-parser.ts` and check `design-ir.json`.
3.  Re-run `run-spec-gen.ts` and check `openapi.json`.
4.  Re-run `backend-cli` and verify `serviceMainuser.java` and Controller paths.
5.  Confirm names like `filter_2` are gone or replaced with meaningful names (or at least cleaner ones).
