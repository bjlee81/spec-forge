import type { OpenAPIDocument } from '@figma-codegen/spec-gen';
import type { GeneratedFile } from './entity-generator.js';

/**
 * Request/Response DTO 클래스를 생성합니다.
 */
export class JavaDtoGenerator {
    constructor(private readonly basePackage: string) { }

    generate(openapi: OpenAPIDocument): GeneratedFile[] {
        const files: GeneratedFile[] = [];

        for (const [name, schema] of Object.entries(openapi.components.schemas)) {
            if (name.endsWith('CreateRequest')) {
                files.push({
                    fileName: `${name}.java`,
                    path: `dto/request/${name}.java`,
                    content: this.generateRequestDto(name, schema),
                });
            } else {
                // Response DTO
                files.push({
                    fileName: `${name}Response.java`,
                    path: `dto/response/${name}Response.java`,
                    content: this.generateResponseDto(name, schema),
                });
            }
        }

        return files;
    }

    private generateRequestDto(
        name: string,
        schema: { type: string; properties: Record<string, { type: string; format?: string }>; required: string[] },
    ): string {
        const fields = Object.entries(schema.properties)
            .map(([fieldName, prop]) => this.generateRequestField(fieldName, prop, schema.required))
            .join('\n\n');

        const imports = this.collectRequestImports(schema);

        return `package ${this.basePackage}.dto.request;

${imports}
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ${name} {

${fields}
}
`;
    }

    private generateResponseDto(
        name: string,
        schema: { type: string; properties: Record<string, { type: string; format?: string }>; required: string[] },
    ): string {
        const fields = Object.entries(schema.properties)
            .map(([fieldName, prop]) => {
                const javaType = this.toJavaType(fieldName, prop.type, prop.format);
                return `    private ${javaType} ${fieldName};`;
            })
            .join('\n\n');

        return `package ${this.basePackage}.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ${name}Response {

    private Long id;

${fields}

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
`;
    }

    private generateRequestField(
        name: string,
        prop: { type: string; format?: string },
        required: string[],
    ): string {
        const javaType = this.toJavaType(name, prop.type, prop.format);
        const annotations: string[] = [];

        if (required.includes(name)) {
            annotations.push('    @NotNull');
        }
        if (prop.format === 'email') {
            annotations.push('    @Email');
        }
        if (prop.type === 'string' && !prop.format && required.includes(name)) {
            annotations.push('    @NotBlank');
        }

        const annotationStr = annotations.length > 0 ? annotations.join('\n') + '\n' : '';
        return `${annotationStr}    private ${javaType} ${name};`;
    }

    private collectRequestImports(
        schema: { properties: Record<string, { type: string; format?: string }>; required: string[] },
    ): string {
        const imports = new Set<string>();
        imports.add('import jakarta.validation.constraints.*;');
        return [...imports].join('\n');
    }

    private toJavaType(name: string, type: string, format?: string): string {
        if (name === 'id') return 'Long';
        if (format === 'date' || format === 'date-time') return 'LocalDateTime';
        if (format === 'email' || format === 'uri' || format === 'password') return 'String';

        switch (type) {
            case 'integer': return 'Long';
            case 'number': return 'Double';
            case 'boolean': return 'Boolean';
            default: return 'String';
        }
    }
}
