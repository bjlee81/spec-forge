import { describe, it, expect } from 'vitest';
import { JavaEntityGenerator } from './java/entity-generator.js';
import { JavaRepositoryGenerator } from './java/repository-generator.js';
import { JavaServiceGenerator } from './java/service-generator.js';
import { JavaControllerGenerator } from './java/controller-generator.js';
import { JavaDtoGenerator } from './java/dto-generator.js';
import { JavaConfigGenerator } from './java/config-generator.js';
import { JavaMigrationGenerator } from './java/migration-generator.js';
import { JavaApplicationYmlGenerator } from './java/application-yml-generator.js';
import type { OpenAPIDocument } from '@figma-codegen/spec-gen';
import type { DatabaseSchema } from '@figma-codegen/spec-gen';

/** 테스트용 OpenAPI 문서 */
function createMockOpenAPI(): OpenAPIDocument {
    return {
        openapi: '3.0.3',
        info: { title: 'Test API', version: '1.0.0', description: 'Test' },
        paths: {
            '/users': {
                get: {
                    summary: 'List users',
                    operationId: 'listUser',
                    tags: ['User'],
                    responses: { '200': { description: 'OK' } },
                },
                post: {
                    summary: 'Create user',
                    operationId: 'createUser',
                    tags: ['User'],
                    requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/UserCreateRequest' } } } },
                    responses: { '201': { description: 'Created' } },
                },
            },
            '/users/{id}': {
                get: {
                    summary: 'Get user',
                    operationId: 'getUser',
                    tags: ['User'],
                    responses: { '200': { description: 'OK' }, '404': { description: 'Not Found' } },
                },
                put: {
                    summary: 'Update user',
                    operationId: 'updateUser',
                    tags: ['User'],
                    requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/UserCreateRequest' } } } },
                    responses: { '200': { description: 'OK' } },
                },
                delete: {
                    summary: 'Delete user',
                    operationId: 'deleteUser',
                    tags: ['User'],
                    responses: { '204': { description: 'No Content' } },
                },
            },
        },
        components: {
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        bio: { type: 'string' },
                        active: { type: 'boolean' },
                    },
                    required: ['id', 'name', 'email', 'active'],
                },
                UserCreateRequest: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        bio: { type: 'string' },
                        active: { type: 'boolean' },
                    },
                    required: ['name', 'email', 'active'],
                },
            },
        },
    };
}

function createMockDbSchema(): DatabaseSchema {
    return {
        tables: [
            {
                name: 'user',
                columns: [
                    { name: 'id', type: 'BIGINT AUTO_INCREMENT', nullable: false, unique: true },
                    { name: 'name', type: 'VARCHAR(255)', nullable: false, unique: false },
                    { name: 'email', type: 'VARCHAR(320)', nullable: false, unique: true },
                    { name: 'bio', type: 'TEXT', nullable: true, unique: false },
                    { name: 'active', type: 'BOOLEAN', nullable: false, unique: false },
                    { name: 'created_at', type: 'TIMESTAMP', nullable: false, unique: false, defaultValue: 'CURRENT_TIMESTAMP' },
                    { name: 'updated_at', type: 'TIMESTAMP', nullable: false, unique: false, defaultValue: 'CURRENT_TIMESTAMP' },
                ],
                primaryKey: 'id',
                foreignKeys: [],
                indexes: [{ name: 'idx_user_email', columns: ['email'], unique: true }],
            },
        ],
        sql: 'CREATE TABLE IF NOT EXISTS user (...);',
    };
}

const BASE_PKG = 'com.example.myapi';

describe('JavaEntityGenerator', () => {
    const gen = new JavaEntityGenerator(BASE_PKG);

    it('JPA @Entity 클래스를 생성해야 한다', () => {
        const result = gen.generate(createMockOpenAPI());
        expect(result).toHaveLength(1);

        const entity = result[0];
        expect(entity.fileName).toBe('User.java');
        expect(entity.content).toContain('@Entity');
        expect(entity.content).toContain('@Table(name = "users")');
        expect(entity.content).toContain('@Id');
        expect(entity.content).toContain('@GeneratedValue');
        expect(entity.content).toContain('private String name;');
        expect(entity.content).toContain('private String email;');
        expect(entity.content).toContain('private Boolean active;');
        expect(entity.content).toContain('package ' + BASE_PKG + '.domain;');
    });

    it('CreateRequest 스키마는 Entity로 생성하지 않아야 한다', () => {
        const result = gen.generate(createMockOpenAPI());
        expect(result.every(r => !r.fileName.includes('CreateRequest'))).toBe(true);
    });

    it('감사 필드(createdAt, updatedAt)를 자동으로 포함해야 한다', () => {
        const result = gen.generate(createMockOpenAPI());
        const entity = result[0];
        expect(entity.content).toContain('createdAt');
        expect(entity.content).toContain('updatedAt');
    });
});

describe('JavaRepositoryGenerator', () => {
    const gen = new JavaRepositoryGenerator(BASE_PKG);

    it('JpaRepository 인터페이스를 생성해야 한다', () => {
        const result = gen.generate(['User']);
        expect(result).toHaveLength(1);

        const repo = result[0];
        expect(repo.fileName).toBe('UserRepository.java');
        expect(repo.content).toContain('extends JpaRepository<User, Long>');
        expect(repo.content).toContain('@Repository');
        expect(repo.content).toContain('package ' + BASE_PKG + '.repository;');
    });
});

describe('JavaServiceGenerator', () => {
    const gen = new JavaServiceGenerator(BASE_PKG);

    it('Service 인터페이스와 구현체를 생성해야 한다', () => {
        const result = gen.generate(['User']);
        expect(result).toHaveLength(2);

        const iface = result.find(r => r.fileName === 'UserService.java')!;
        expect(iface).toBeDefined();
        expect(iface.content).toContain('interface UserService');
        expect(iface.content).toContain('findAll()');
        expect(iface.content).toContain('findById(Long id)');
        expect(iface.content).toContain('create(');
        expect(iface.content).toContain('update(');
        expect(iface.content).toContain('delete(Long id)');

        const impl = result.find(r => r.fileName === 'UserServiceImpl.java')!;
        expect(impl).toBeDefined();
        expect(impl.content).toContain('@Service');
        expect(impl.content).toContain('implements UserService');
        expect(impl.content).toContain('UserRepository');
    });
});

describe('JavaControllerGenerator', () => {
    const gen = new JavaControllerGenerator(BASE_PKG);

    it('REST Controller를 생성해야 한다', () => {
        const result = gen.generate(['User']);
        expect(result).toHaveLength(1);

        const ctrl = result[0];
        expect(ctrl.fileName).toBe('UserController.java');
        expect(ctrl.content).toContain('@RestController');
        expect(ctrl.content).toContain('@RequestMapping("/api/v1/users")');
        expect(ctrl.content).toContain('@GetMapping');
        expect(ctrl.content).toContain('@PostMapping');
        expect(ctrl.content).toContain('@PutMapping("/{id}")');
        expect(ctrl.content).toContain('@DeleteMapping("/{id}")');
        expect(ctrl.content).toContain('UserService');
        expect(ctrl.content).toContain('package ' + BASE_PKG + '.controller;');
    });
});

describe('JavaDtoGenerator', () => {
    const gen = new JavaDtoGenerator(BASE_PKG);

    it('Request/Response DTO를 생성해야 한다', () => {
        const result = gen.generate(createMockOpenAPI());

        const createReq = result.find(r => r.fileName === 'UserCreateRequest.java')!;
        expect(createReq).toBeDefined();
        expect(createReq.content).toContain('package ' + BASE_PKG + '.dto.request;');
        expect(createReq.content).toContain('@NotNull');
        expect(createReq.content).toContain('private String name;');
        expect(createReq.content).toContain('@Email');

        const response = result.find(r => r.fileName === 'UserResponse.java')!;
        expect(response).toBeDefined();
        expect(response.content).toContain('package ' + BASE_PKG + '.dto.response;');
        expect(response.content).toContain('private Long id;');
    });
});

describe('JavaConfigGenerator', () => {
    const gen = new JavaConfigGenerator(BASE_PKG);

    it('SwaggerConfig를 생성해야 한다', () => {
        const result = gen.generateSwaggerConfig('Test API', '1.0.0');
        expect(result.fileName).toBe('SwaggerConfig.java');
        expect(result.content).toContain('@Configuration');
        expect(result.content).toContain('OpenAPI');
        expect(result.content).toContain('Test API');
    });

    it('WebConfig를 생성해야 한다', () => {
        const result = gen.generateWebConfig();
        expect(result.fileName).toBe('WebConfig.java');
        expect(result.content).toContain('@Configuration');
        expect(result.content).toContain('CorsRegistry');
    });

    it('GlobalExceptionHandler를 생성해야 한다', () => {
        const result = gen.generateExceptionHandler();
        expect(result.fileName).toBe('GlobalExceptionHandler.java');
        expect(result.content).toContain('@ControllerAdvice');
        expect(result.content).toContain('@ExceptionHandler');
        expect(result.content).toContain('ErrorResponse');
    });

    it('ErrorResponse DTO를 생성해야 한다', () => {
        const result = gen.generateErrorResponse();
        expect(result.fileName).toBe('ErrorResponse.java');
        expect(result.content).toContain('timestamp');
        expect(result.content).toContain('status');
        expect(result.content).toContain('message');
    });
});

describe('JavaMigrationGenerator', () => {
    const gen = new JavaMigrationGenerator();

    it('Flyway V1 마이그레이션 SQL을 생성해야 한다', () => {
        const result = gen.generate(createMockDbSchema());
        expect(result.fileName).toBe('V1__init_schema.sql');
        expect(result.content).toContain('CREATE TABLE');
    });
});

describe('JavaApplicationYmlGenerator', () => {
    const gen = new JavaApplicationYmlGenerator();

    it('기본 application.yml을 생성해야 한다', () => {
        const result = gen.generate({
            projectName: 'my-api',
            database: 'postgresql',
            includeAuth: false,
        });

        expect(result).toHaveLength(3);
        const main = result.find(r => r.fileName === 'application.yml')!;
        expect(main).toBeDefined();
        expect(main.content).toContain('my-api');
        expect(main.content).toContain('profiles');

        const dev = result.find(r => r.fileName === 'application-dev.yml')!;
        expect(dev).toBeDefined();
        expect(dev.content).toContain('h2');

        const prod = result.find(r => r.fileName === 'application-prod.yml')!;
        expect(prod).toBeDefined();
        expect(prod.content).toContain('postgresql');
    });
});
