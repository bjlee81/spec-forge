import type { GeneratedFile } from './entity-generator.js';

export interface ApplicationYmlConfig {
    projectName: string;
    database: 'postgresql' | 'mysql' | 'sqlite';
    includeAuth: boolean;
}

/**
 * 프로파일별 application.yml 파일을 생성합니다.
 */
export class JavaApplicationYmlGenerator {
    generate(config: ApplicationYmlConfig): GeneratedFile[] {
        return [
            {
                fileName: 'application.yml',
                path: 'application.yml',
                content: this.generateMain(config),
            },
            {
                fileName: 'application-dev.yml',
                path: 'application-dev.yml',
                content: this.generateDev(config),
            },
            {
                fileName: 'application-prod.yml',
                path: 'application-prod.yml',
                content: this.generateProd(config),
            },
        ];
    }

    private generateMain(config: ApplicationYmlConfig): string {
        return `spring:
  application:
    name: ${config.projectName}
  profiles:
    active: dev
  jpa:
    open-in-view: false
    hibernate:
      ddl-auto: validate

server:
  port: 8080

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
`;
    }

    private generateDev(config: ApplicationYmlConfig): string {
        return `spring:
  datasource:
    url: jdbc:h2:mem:${config.projectName.replace(/-/g, '_')}_dev
    driver-class-name: org.h2.Driver
    username: sa
    password:
  h2:
    console:
      enabled: true
      path: /h2-console
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: true
    properties:
      hibernate:
        format_sql: true
  flyway:
    enabled: false

logging:
  level:
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
`;
    }

    private generateProd(config: ApplicationYmlConfig): string {
        const dbUrl = this.getDatabaseUrl(config);
        const driverClass = this.getDriverClass(config);

        return `spring:
  datasource:
    url: \${DB_URL:${dbUrl}}
    driver-class-name: ${driverClass}
    username: \${DB_USERNAME:app}
    password: \${DB_PASSWORD:}
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
  flyway:
    enabled: true
    locations: classpath:db/migration

logging:
  level:
    root: WARN
    ${config.projectName.replace(/-/g, '.')}: INFO
`;
    }

    private getDatabaseUrl(config: ApplicationYmlConfig): string {
        switch (config.database) {
            case 'postgresql':
                return `jdbc:postgresql://localhost:5432/${config.projectName.replace(/-/g, '_')}`;
            case 'mysql':
                return `jdbc:mysql://localhost:3306/${config.projectName.replace(/-/g, '_')}`;
            case 'sqlite':
                return `jdbc:sqlite:${config.projectName}.db`;
        }
    }

    private getDriverClass(config: ApplicationYmlConfig): string {
        switch (config.database) {
            case 'postgresql': return 'org.postgresql.Driver';
            case 'mysql': return 'com.mysql.cj.jdbc.Driver';
            case 'sqlite': return 'org.sqlite.JDBC';
        }
    }
}
