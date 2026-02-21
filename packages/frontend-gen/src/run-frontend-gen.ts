import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { FrontendGenerator, FrontendGenOptions } from './generator.js';
import type { DesignIR } from '@figma-codegen/design-parser';

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: npx tsx run-frontend-gen.ts <input-ir-json-path> <output-dir>');
        process.exit(1);
    }

    const inputPath = resolve(args[0]);
    const outputDir = resolve(args[1]);

    if (!existsSync(inputPath)) {
        console.error(`❌ Input file not found: ${inputPath}`);
        process.exit(1);
    }

    try {
        const rawData = readFileSync(inputPath, 'utf-8');
        const ir = JSON.parse(rawData) as DesignIR;

        const options: FrontendGenOptions = {
            outputDir,
        };

        const generator = new FrontendGenerator(options);
        const generatedFiles = await generator.generate(ir);

        console.log(`✅ Frontend generated successfully in: ${outputDir}`);
        console.log(`Generated ${generatedFiles.length} files:`);
        generatedFiles.forEach(file => console.log(`  - ${file}`));

    } catch (error) {
        console.error('❌ Failed to generate frontend:', error);
        process.exit(1);
    }
}

main();
