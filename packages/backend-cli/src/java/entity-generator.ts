import type { OpenAPIDocument } from '@figma-codegen/spec-gen';

export interface GeneratedFile {
    fileName: string;
    path: string;
    content: string;
}

/**
 * OpenAPI 스키마에서 JPA @Entity 클래스를 생성합니다.
 */
export class JavaEntityGenerator {
    constructor(private readonly basePackage: string) { }

    generate(openapi: OpenAPIDocument): GeneratedFile[] {
        const files: GeneratedFile[] = [];

        for (const [name, schema] of Object.entries(openapi.components.schemas)) {
            // CreateRequest 스키마는 건너뜁니다
            if (name.endsWith('CreateRequest')) continue;

            const code = this.generateEntity(name, schema);
            files.push({
                fileName: `${name}.java`,
                path: `domain/${name}.java`,
                content: code,
            });
        }

        return files;
    }

    private generateEntity(
        name: string,
        schema: { type: string; properties: Record<string, { type: string; format?: string; description?: string }>; required: string[] },
    ): string {
        const tableName = this.pluralize(this.toSnakeCase(name));
        const fields = Object.entries(schema.properties)
            .filter(([fieldName]) => fieldName !== 'id')
            .map(([fieldName, prop]) => this.generateField(fieldName, prop))
            .join('\n\n');

        return `package ${this.basePackage}.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "${tableName}")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ${name} {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

${fields}

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
`;
    }

    private generateField(name: string, prop: { type: string; format?: string }): string {
        const javaType = this.toJavaType(prop.type, prop.format);
        const columnName = this.toSnakeCase(name);
        const annotations: string[] = [];

        if (prop.format === 'email') {
            annotations.push('    @Column(name = "' + columnName + '", unique = true)');
        } else {
            annotations.push('    @Column(name = "' + columnName + '")');
        }

        return `${annotations.join('\n')}\n    private ${javaType} ${name};`;
    }

    private toJavaType(type: string, format?: string): string {
        if (format === 'date') return 'LocalDateTime';
        if (format === 'date-time') return 'LocalDateTime';
        if (format === 'email' || format === 'uri' || format === 'password') return 'String';

        switch (type) {
            case 'integer': return 'Long';
            case 'number': return 'Double';
            case 'boolean': return 'Boolean';
            default: return 'String';
        }
    }

    private toSnakeCase(str: string): string {
        return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
    }

    private pluralize(name: string): string {
        if (name.endsWith('s')) return name;
        if (name.endsWith('y')) return name.slice(0, -1) + 'ies';
        return name + 's';
    }
}
