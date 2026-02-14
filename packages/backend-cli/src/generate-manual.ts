import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { BackendScaffolder, type BackendConfig } from './scaffolder.js';
import type { OpenAPIDocument, DatabaseSchema } from '@figma-codegen/spec-gen';

async function main() {
    const openApiPath = process.argv[2];
    const schemaPath = process.argv[3];
    const outputDir = process.argv[4];

    if (!openApiPath || !schemaPath || !outputDir) {
        console.error('Usage: tsx src/generate-manual.ts <openapi-json> <schema-json> <output-dir>');
        process.exit(1);
    }

    console.log(`Generating Backend Code to ${outputDir}...`);

    try {
        const openApiContent = await readFile(openApiPath, 'utf-8');
        const schemaContent = await readFile(schemaPath, 'utf-8');

        const openapi: OpenAPIDocument = JSON.parse(openApiContent);
        const dbSchema: DatabaseSchema = JSON.parse(schemaContent);

        const config: BackendConfig = {
            projectName: 'myservice-backend',
            language: 'java',
            framework: 'spring-boot',
            database: 'h2', // Using H2 for simple testing
            includeDocker: false,
            includeAuth: false,
            outputDir: outputDir,
            packageName: 'com.example.myservice',
            groupId: 'com.example',
            artifactId: 'myservice-backend',
            javaVersion: '17',
            springBootVersion: '3.5.10',
        } as any; // Type assertion since BackendConfig might have exact string types for vars

        const scaffolder = new BackendScaffolder();
        await scaffolder.scaffold(config, openapi, dbSchema);

        console.log(`✅ Successfully generated backend project at ${outputDir}`);

    } catch (error) {
        console.error('❌ Error generating code:', error);
        process.exit(1);
    }
}

main();
