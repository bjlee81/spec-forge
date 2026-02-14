/**
 * Spring Initializr (start.spring.io) REST API 연동 클라이언트.
 * 공식 Gradle 프로젝트 ZIP을 다운로드합니다.
 */

export interface SpringInitializrConfig {
    groupId: string;
    artifactId: string;
    name: string;
    description: string;
    packageName: string;
    javaVersion: string;
    springBootVersion: string;
    dependencies: string[];
    database: 'postgresql' | 'mysql' | 'sqlite';
    includeDocker?: boolean;
    includeAuth?: boolean;
}

export class SpringInitializr {
    private readonly baseUrl = 'https://start.spring.io/starter.zip';

    /**
     * start.spring.io에서 ZIP을 다운로드하기 위한 URL을 빌드합니다.
     */
    buildUrl(config: SpringInitializrConfig): string {
        const deps = this.resolveDependencies(config);
        const params = new URLSearchParams({
            type: 'gradle-project',
            language: 'java',
            bootVersion: config.springBootVersion,
            groupId: config.groupId,
            artifactId: config.artifactId,
            name: config.name,
            description: config.description,
            packageName: config.packageName,
            javaVersion: config.javaVersion,
            packaging: 'jar',
            dependencies: deps.join(','),
        });

        return `${this.baseUrl}?${params.toString()}`;
    }

    /**
     * 설정에 따라 필요한 의존성을 자동으로 해결합니다.
     */
    resolveDependencies(config: SpringInitializrConfig): string[] {
        const deps = new Set<string>(config.dependencies);

        // 기본 의존성 추가
        for (const d of this.getDefaultDependencies()) {
            deps.add(d);
        }

        // DB 드라이버
        switch (config.database) {
            case 'postgresql':
                deps.add('postgresql');
                break;
            case 'mysql':
                deps.add('mysql');
                break;
            case 'sqlite':
                deps.add('h2'); // SQLite는 Spring에서 H2로 fallback
                break;
        }

        // 옵션 기반 의존성
        if (config.includeAuth) {
            deps.add('security');
        }
        if (config.includeDocker) {
            deps.add('docker-compose');
        }

        // 테스트용 인메모리 DB
        deps.add('h2');

        return [...deps];
    }

    /**
     * Spring Boot 프로젝트의 기본 필수 의존성 목록.
     */
    getDefaultDependencies(): string[] {
        return [
            'web',
            'data-jpa',
            'validation',
            'actuator',
            'devtools',
            'lombok',
            'flyway',
            'configuration-processor',
        ];
    }

    /**
     * start.spring.io에서 ZIP을 다운로드합니다.
     * @returns ZIP 데이터 Buffer
     */
    async download(config: SpringInitializrConfig): Promise<Buffer> {
        const url = this.buildUrl(config);
        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Spring Initializr 다운로드 실패: ${response.status} ${response.statusText}\nResponse: ${errorText}`
            );
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }
}
