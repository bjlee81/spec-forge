import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpringInitializr, type SpringInitializrConfig } from './spring-initializr.js';

describe('SpringInitializr', () => {
    let initializr: SpringInitializr;

    beforeEach(() => {
        initializr = new SpringInitializr();
    });

    describe('buildUrl', () => {
        it('기본 설정으로 올바른 URL을 빌드해야 한다', () => {
            const config: SpringInitializrConfig = {
                groupId: 'com.example',
                artifactId: 'my-api',
                name: 'my-api',
                description: 'My API',
                packageName: 'com.example.myapi',
                javaVersion: '21',
                springBootVersion: '4.0.2',
                dependencies: ['web', 'data-jpa', 'validation'],
                database: 'postgresql',
            };

            const url = initializr.buildUrl(config);

            expect(url).toContain('start.spring.io/starter.zip');
            expect(url).toContain('type=gradle-project');
            expect(url).toContain('language=java');
            expect(url).toContain('bootVersion=4.0.2');
            expect(url).toContain('groupId=com.example');
            expect(url).toContain('artifactId=my-api');
            expect(url).toContain('javaVersion=21');
            expect(url).toContain('dependencies=web%2Cdata-jpa%2Cvalidation');
        });

        it('DB와 옵션에 따라 의존성을 자동 추가해야 한다', () => {
            const config: SpringInitializrConfig = {
                groupId: 'com.example',
                artifactId: 'test',
                name: 'test',
                description: 'Test',
                packageName: 'com.example.test',
                javaVersion: '21',
                springBootVersion: '4.0.2',
                dependencies: ['web'],
                database: 'postgresql',
                includeDocker: true,
                includeAuth: true,
            };

            const deps = initializr.resolveDependencies(config);

            expect(deps).toContain('web');
            expect(deps).toContain('postgresql');
            expect(deps).toContain('security');
            expect(deps).toContain('docker-compose');
            expect(deps).toContain('actuator');
            expect(deps).toContain('flyway');
        });

        it('MySQL일 때 mysql 드라이버 의존성을 추가해야 한다', () => {
            const config: SpringInitializrConfig = {
                groupId: 'com.example',
                artifactId: 'test',
                name: 'test',
                description: 'Test',
                packageName: 'com.example.test',
                javaVersion: '17',
                springBootVersion: '4.0.2',
                dependencies: ['web'],
                database: 'mysql',
            };

            const deps = initializr.resolveDependencies(config);
            expect(deps).toContain('mysql');
        });
    });

    describe('getDefaultDependencies', () => {
        it('필수 기본 의존성을 포함해야 한다', () => {
            const defaults = initializr.getDefaultDependencies();

            expect(defaults).toContain('web');
            expect(defaults).toContain('data-jpa');
            expect(defaults).toContain('validation');
            expect(defaults).toContain('actuator');
            expect(defaults).toContain('devtools');
            expect(defaults).toContain('lombok');
            expect(defaults).toContain('flyway');
        });
    });
});
