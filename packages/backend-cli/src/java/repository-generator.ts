import type { GeneratedFile } from './entity-generator.js';

/**
 * JPA Repository 인터페이스를 생성합니다.
 */
export class JavaRepositoryGenerator {
    constructor(private readonly basePackage: string) { }

    generate(entityNames: string[]): GeneratedFile[] {
        return entityNames.map(name => ({
            fileName: `${name}Repository.java`,
            path: `repository/${name}Repository.java`,
            content: this.generateRepository(name),
        }));
    }

    private generateRepository(name: string): string {
        return `package ${this.basePackage}.repository;

import ${this.basePackage}.domain.${name};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ${name}Repository extends JpaRepository<${name}, Long> {
}
`;
    }
}
