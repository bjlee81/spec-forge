import type { GeneratedFile } from './entity-generator.js';

/**
 * Service 인터페이스와 구현체를 생성합니다.
 */
export class JavaServiceGenerator {
    constructor(private readonly basePackage: string) { }

    generate(entityNames: string[]): GeneratedFile[] {
        const files: GeneratedFile[] = [];

        for (const name of entityNames) {
            files.push({
                fileName: `${name}Service.java`,
                path: `service/${name}Service.java`,
                content: this.generateInterface(name),
            });
            files.push({
                fileName: `${name}ServiceImpl.java`,
                path: `service/impl/${name}ServiceImpl.java`,
                content: this.generateImpl(name),
            });
        }

        return files;
    }

    private generateInterface(name: string): string {
        const lower = name.charAt(0).toLowerCase() + name.slice(1);
        return `package ${this.basePackage}.service;

import ${this.basePackage}.domain.${name};
import ${this.basePackage}.dto.request.${name}CreateRequest;

import java.util.List;
import java.util.Optional;

public interface ${name}Service {

    List<${name}> findAll();

    Optional<${name}> findById(Long id);

    ${name} create(${name}CreateRequest request);

    ${name} update(Long id, ${name}CreateRequest request);

    void delete(Long id);
}
`;
    }

    private generateImpl(name: string): string {
        const lower = name.charAt(0).toLowerCase() + name.slice(1);
        return `package ${this.basePackage}.service.impl;

import ${this.basePackage}.domain.${name};
import ${this.basePackage}.dto.request.${name}CreateRequest;
import ${this.basePackage}.repository.${name}Repository;
import ${this.basePackage}.service.${name}Service;
import ${this.basePackage}.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ${name}ServiceImpl implements ${name}Service {

    private final ${name}Repository ${lower}Repository;

    @Override
    public List<${name}> findAll() {
        return ${lower}Repository.findAll();
    }

    @Override
    public Optional<${name}> findById(Long id) {
        return ${lower}Repository.findById(id);
    }

    @Override
    @Transactional
    public ${name} create(${name}CreateRequest request) {
        ${name} entity = ${name}.builder()
                // TODO: map request fields to entity
                .build();
        return ${lower}Repository.save(entity);
    }

    @Override
    @Transactional
    public ${name} update(Long id, ${name}CreateRequest request) {
        ${name} entity = ${lower}Repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("${name}", "id", id));
        // TODO: update entity fields from request
        return ${lower}Repository.save(entity);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!${lower}Repository.existsById(id)) {
            throw new ResourceNotFoundException("${name}", "id", id);
        }
        ${lower}Repository.deleteById(id);
    }
}
`;
    }
}
