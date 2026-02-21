import type { GeneratedFile } from './entity-generator.js';

/**
 * REST Controller를 생성합니다.
 */
export class JavaControllerGenerator {
    constructor(private readonly basePackage: string) { }

    generate(entityNames: string[]): GeneratedFile[] {
        return entityNames.map(name => ({
            fileName: `${name}Controller.java`,
            path: `controller/${name}Controller.java`,
            content: this.generateController(name),
        }));
    }

    private generateController(name: string): string {
        const lower = name.charAt(0).toLowerCase() + name.slice(1);
        const plural = this.pluralize(lower);

        return `package ${this.basePackage}.controller;

import ${this.basePackage}.domain.${name};
import ${this.basePackage}.dto.request.${name}CreateRequest;
import ${this.basePackage}.service.${name}Service;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/${plural}")
@RequiredArgsConstructor
public class ${name}Controller {

    private final ${name}Service ${lower}Service;

    @GetMapping
    public ResponseEntity<List<${name}>> findAll() {
        return ResponseEntity.ok(${lower}Service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<${name}> findById(@PathVariable Long id) {
        return ${lower}Service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<${name}> create(@Valid @RequestBody ${name}CreateRequest request) {
        ${name} created = ${lower}Service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<${name}> update(@PathVariable Long id, @Valid @RequestBody ${name}CreateRequest request) {
        return ResponseEntity.ok(${lower}Service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        ${lower}Service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
`;
    }

    private pluralize(name: string): string {
        if (name.endsWith('s')) return name;
        if (name.endsWith('y')) return name.slice(0, -1) + 'ies';
        return name + 's';
    }
}
