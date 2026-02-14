import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { OpenAPIGenerator } from './openapi-generator.js';
import { SchemaGenerator } from './schema-generator.js';
// We might need yaml library if OpenAPIGenerator returns an object, but let's see. 
// Usually generators return string or object.
// Checking index.ts imports, it seems they are exported classes.

async function main() {
    const inputPath = process.argv[2];
    const outputDir = process.argv[3];

    if (!inputPath || !outputDir) {
        console.error('Usage: tsx src/run-spec-gen.ts <input-design-ir-json> <output-dir>');
        process.exit(1);
    }

    console.log(`Generating specs from ${inputPath}...`);

    try {
        const data = await readFile(inputPath, 'utf-8');
        const designIR = JSON.parse(data);

        await mkdir(outputDir, { recursive: true });

        // 1. Generate OpenAPI
        const openApiGenerator = new OpenAPIGenerator();
        const openApiDoc = openApiGenerator.generate(designIR);
        // Assuming openApiDoc is an object, we need to convert to YAML or JSON.
        // For now, let's save as JSON for simplicity, or YAML if we have a dumper.
        // Actually, let's just save as JSON first as it's built-in.
        await writeFile(join(outputDir, 'openapi.json'), JSON.stringify(openApiDoc, null, 2));
        console.log(`✅ Generated openapi.json`);

        // 2. Generate SQL Schema
        const schemaGenerator = new SchemaGenerator();
        const schema = schemaGenerator.generate(designIR);
        // Assuming schema is a string or object. If string (SQL), write directly.
        // If object (DatabaseSchema), we might need to serialize it.
        // Let's assume it returns a DatabaseSchema object and we need to convert to SQL string.
        // Wait, I should check schema-generator.ts to see what .generate returns and if there is a .toSql() method.
        // If not, I'll inspect the output.

        // Let's try to write the Schema Object as JSON first for debugging/inspection.
        await writeFile(join(outputDir, 'schema.json'), JSON.stringify(schema, null, 2));
        console.log(`✅ Generated schema.json`);

        // If SchemaGenerator has a 'toDDL' or similar, we should use it.
        // For the MVP manual pipeline, I'll inspect schema.json to see if I need to write a SQL serializer.

    } catch (error) {
        console.error('❌ Error generating specs:', error);
        process.exit(1);
    }
}

main();
