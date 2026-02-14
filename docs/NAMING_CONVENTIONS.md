# Naming Conventions for Figma to Code Generation

This document outlines the naming standards to be applied when transforming Figma designs into backend code.

## 1. General Principles
- **Readability**: Names should be human-readable and meaningful.
- **Sanitization**: All special characters from Figma (e.g., `>`, `(`, `)`, emojis) must be removed.
- **Consistency**: Adhere to language-specific idioms (Java, REST, SQL).

## 2. Java (Spring Boot)
### Classes (Entities, DTOs, Controllers)
- **Format**: `PascalCase`
- **Source**: Figma Frame/Group names.
- **Rules**:
  - Remove generic suffixes if redundant (e.g., `Screen`, `Frame` is okay if meaningful, but `Frame 123` is not).
  - Example: `service > Main (user)` -> `serviceMainuser`
  - Example: `User Profile` -> `UserProfile`

### Fields (Variables)
- **Format**: `camelCase`
- **Source**: Figma Text/Input layer names.
- **Rules**:
  - Deduplicate with indices if necessary (`filter`, `filter2`).
  - Example: `text area` -> `textArea`
  - Example: `Created At` -> `createdAt`

## 3. API (OpenAPI/REST)
### Resource Paths
- **Format**: `kebab-case` (pluralized)
- **Source**: Entity name.
- **Rules**:
  - Lowercase, hyphen-separated.
  - Example: `serviceMainuser` -> `/service-main-users`
  - Example: `UserProfile` -> `/user-profiles`

### Query Parameters
- **Format**: `camelCase`
- **Source**: Field names.
- **Example**: `?startDate=...&filterType=...`

## 4. Database (SQL)
### Table Names
- **Format**: `snake_case` (pluralized)
- **Source**: Entity name.
- **Rules**:
  - Example: `serviceMainuser` -> `service_main_users`

### Column Names
- **Format**: `snake_case`
- **Source**: Field names.
- **Rules**:
  - Example: `textArea` -> `text_area`
  - Example: `createdAt` -> `created_at`

## 5. Implementation Strategy
1. **Parser Level**: `design-parser` should output cleaned `camelCase` and `PascalCase` names in the `DesignIR`.
2. **Spec Level**: `spec-gen` should transform these into `kebab-case` for URLs and `snake_case` for SQL.
