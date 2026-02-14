import { describe, it, expect } from 'vitest';
import { OpenAPIGenerator } from './openapi-generator.js';
import { SchemaGenerator } from './schema-generator.js';
import type { DesignIR } from '@figma-codegen/design-parser';

function createMockIR(): DesignIR {
    return {
        projectName: 'Test App',
        screens: [
            {
                id: 's1',
                name: 'User List',
                screenType: 'LIST',
                elements: [],
            },
        ],
        dataModels: [
            {
                name: 'User',
                description: 'User entity',
                fields: [
                    { name: 'name', type: 'STRING', required: true },
                    { name: 'email', type: 'EMAIL', required: true, unique: true },
                    { name: 'bio', type: 'TEXT', required: false },
                    { name: 'active', type: 'BOOLEAN', required: true },
                ],
                relations: [],
            },
        ],
        flows: [],
        components: [],
    };
}

describe('OpenAPIGenerator', () => {
    const generator = new OpenAPIGenerator();

    it('유효한 OpenAPI 3.0 문서를 생성해야 한다', () => {
        const ir = createMockIR();
        const doc = generator.generate(ir);

        expect(doc.openapi).toBe('3.0.3');
        expect(doc.info.title).toContain('Test App');
        expect(doc.paths).toBeDefined();
        expect(doc.components.schemas).toBeDefined();
    });

    it('데이터 모델에 대한 CRUD 엔드포인트를 생성해야 한다', () => {
        const ir = createMockIR();
        const doc = generator.generate(ir);

        expect(doc.paths['/users']).toBeDefined();
        expect(doc.paths['/users'].get).toBeDefined();
        expect(doc.paths['/users'].post).toBeDefined();
        expect(doc.paths['/users/{id}']).toBeDefined();
        expect(doc.paths['/users/{id}'].get).toBeDefined();
        expect(doc.paths['/users/{id}'].put).toBeDefined();
        expect(doc.paths['/users/{id}'].delete).toBeDefined();
    });

    it('모델 스키마와 CreateRequest 스키마를 생성해야 한다', () => {
        const ir = createMockIR();
        const doc = generator.generate(ir);

        expect(doc.components.schemas['User']).toBeDefined();
        expect(doc.components.schemas['UserCreateRequest']).toBeDefined();
        expect(doc.components.schemas['User'].properties['email'].format).toBe('email');
    });
});

describe('SchemaGenerator', () => {
    const generator = new SchemaGenerator();

    it('테이블 정의를 생성해야 한다', () => {
        const ir = createMockIR();
        const schema = generator.generate(ir);

        expect(schema.tables).toHaveLength(1);
        expect(schema.tables[0].name).toBe('user');
        expect(schema.tables[0].primaryKey).toBe('id');
    });

    it('유효한 SQL DDL을 생성해야 한다', () => {
        const ir = createMockIR();
        const schema = generator.generate(ir);

        expect(schema.sql).toContain('CREATE TABLE');
        expect(schema.sql).toContain('PRIMARY KEY');
        expect(schema.sql).toContain('created_at');
        expect(schema.sql).toContain('updated_at');
    });

    it('감사 컬럼을 자동으로 추가해야 한다', () => {
        const ir = createMockIR();
        const schema = generator.generate(ir);
        const userTable = schema.tables[0];

        expect(userTable.columns.some(c => c.name === 'created_at')).toBe(true);
        expect(userTable.columns.some(c => c.name === 'updated_at')).toBe(true);
    });
});
