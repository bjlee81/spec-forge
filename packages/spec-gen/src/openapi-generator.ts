import type { DesignIR, Screen, DataModel, DataField } from '@figma-codegen/design-parser';

export interface OpenAPIDocument {
    openapi: string;
    info: { title: string; version: string; description: string };
    paths: Record<string, Record<string, PathOperation>>;
    components: { schemas: Record<string, SchemaObject> };
}

interface PathOperation {
    summary: string;
    operationId: string;
    tags: string[];
    requestBody?: { content: { 'application/json': { schema: { $ref: string } } } };
    responses: Record<string, { description: string; content?: { 'application/json': { schema: { $ref?: string; type?: string; items?: { $ref: string } } } } }>;
}

interface SchemaObject {
    type: string;
    properties: Record<string, { type: string; format?: string; description?: string }>;
    required: string[];
}

/**
 * Design IR에서 OpenAPI 3.0 스펙을 생성합니다.
 */
export class OpenAPIGenerator {
    generate(ir: DesignIR): OpenAPIDocument {
        const schemas = this.generateSchemas(ir.dataModels);
        const paths = this.generatePaths(ir);

        return {
            openapi: '3.0.3',
            info: {
                title: `${ir.projectName} API`,
                version: '1.0.0',
                description: `Auto-generated API specification for ${ir.projectName}`,
            },
            paths,
            components: { schemas },
        };
    }

    private generateSchemas(models: DataModel[]): Record<string, SchemaObject> {
        const schemas: Record<string, SchemaObject> = {};

        for (const model of models) {
            schemas[model.name] = {
                type: 'object',
                properties: Object.fromEntries(
                    model.fields.map(f => [f.name, this.fieldToSchemaProperty(f)])
                ),
                required: model.fields.filter(f => f.required).map(f => f.name),
            };

            // 생성 요청용 스키마 (ID 제외)
            schemas[`${model.name}CreateRequest`] = {
                type: 'object',
                properties: Object.fromEntries(
                    model.fields
                        .filter(f => f.name !== 'id')
                        .map(f => [f.name, this.fieldToSchemaProperty(f)])
                ),
                required: model.fields.filter(f => f.required && f.name !== 'id').map(f => f.name),
            };
        }

        return schemas;
    }

    private fieldToSchemaProperty(field: DataField): { type: string; format?: string; description?: string } {
        const prop: { type: string; format?: string; description?: string } = {
            type: 'string',
            description: field.description,
        };

        switch (field.type) {
            case 'INTEGER': prop.type = 'integer'; break;
            case 'FLOAT': prop.type = 'number'; prop.format = 'float'; break;
            case 'BOOLEAN': prop.type = 'boolean'; break;
            case 'DATE': prop.type = 'string'; prop.format = 'date'; break;
            case 'DATETIME': prop.type = 'string'; prop.format = 'date-time'; break;
            case 'EMAIL': prop.type = 'string'; prop.format = 'email'; break;
            case 'PASSWORD': prop.type = 'string'; prop.format = 'password'; break;
            case 'URL': prop.type = 'string'; prop.format = 'uri'; break;
        }

        return prop;
    }

    private generatePaths(ir: DesignIR): Record<string, Record<string, PathOperation>> {
        const paths: Record<string, Record<string, PathOperation>> = {};

        for (const model of ir.dataModels) {
            // Use kebab-case for URLs: /myservice-main-dealers
            const resourceName = this.toKebabCase(model.name);
            const pluralized = this.pluralize(resourceName);
            const basePath = `/${pluralized}`;

            const tag = model.name; // Keep PascalCase for tags
            const ref = `#/components/schemas/${model.name}`;
            const createRef = `#/components/schemas/${model.name}CreateRequest`;

            // GET /resources — 목록 조회
            paths[basePath] = {
                get: {
                    summary: `${model.name} 목록 조회`,
                    operationId: `list${model.name}`,
                    tags: [tag],
                    responses: {
                        '200': {
                            description: 'OK',
                            content: { 'application/json': { schema: { type: 'array', items: { $ref: ref } } } },
                        },
                    },
                },
                post: {
                    summary: `${model.name} 생성`,
                    operationId: `create${model.name}`,
                    tags: [tag],
                    requestBody: { content: { 'application/json': { schema: { $ref: createRef } } } },
                    responses: {
                        '201': {
                            description: 'Created',
                            content: { 'application/json': { schema: { $ref: ref } } },
                        },
                    },
                },
            };

            // GET/PUT/DELETE /resources/:id — 단건 조회/수정/삭제
            paths[`${basePath}/{id}`] = {
                get: {
                    summary: `${model.name} 상세 조회`,
                    operationId: `get${model.name}`,
                    tags: [tag],
                    responses: {
                        '200': {
                            description: 'OK',
                            content: { 'application/json': { schema: { $ref: ref } } },
                        },
                        '404': { description: 'Not Found' },
                    },
                },
                put: {
                    summary: `${model.name} 수정`,
                    operationId: `update${model.name}`,
                    tags: [tag],
                    requestBody: { content: { 'application/json': { schema: { $ref: createRef } } } },
                    responses: {
                        '200': {
                            description: 'OK',
                            content: { 'application/json': { schema: { $ref: ref } } },
                        },
                        '404': { description: 'Not Found' },
                    },
                },
                delete: {
                    summary: `${model.name} 삭제`,
                    operationId: `delete${model.name}`,
                    tags: [tag],
                    responses: {
                        '204': { description: 'No Content' },
                        '404': { description: 'Not Found' },
                    },
                },
            };
        }

        return paths;
    }

    private pluralize(name: string): string {
        if (name.endsWith('s')) return name;
        if (name.endsWith('y')) return name.slice(0, -1) + 'ies';
        return name + 's';
    }

    private toKebabCase(str: string): string {
        return str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[\s_]+/g, '-')
            .toLowerCase();
    }
}
