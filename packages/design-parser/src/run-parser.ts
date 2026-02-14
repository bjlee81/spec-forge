import { DesignParser } from './parser.js';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

async function main() {
    const inputPath = process.argv[2];
    const outputPath = process.argv[3];

    if (!inputPath || !outputPath) {
        console.error('Usage: tsx src/run-parser.ts <input-json-path> <output-json-path>');
        process.exit(1);
    }

    console.log(`Parsing Figma node from ${inputPath}...`);

    try {
        const data = await readFile(inputPath, 'utf-8');
        const figmaNode = JSON.parse(data);

        // DesignParser expects { document: ... } structure typically if it parses a whole file,
        // but let's see how it's implemented. 
        // If we passed a single node, we might need to wrap it or adjust the parser.
        // Let's assume for now we need to wrap it to mimic a file structure or the parser handles nodes.

        // Checking parser.ts implementation (mental model):
        // public parse(file: FigmaFile): DesignIR

        // So we need to mock a FigmaFile
        const mockFile = {
            name: "Extracted Node",
            lastModified: new Date().toISOString(),
            thumbnailUrl: "",
            version: "1.0",
            document: figmaNode // The extracted node is the root here
        };

        const parser = new DesignParser();
        const ir = parser.parse(mockFile as any);

        await mkdir(dirname(outputPath), { recursive: true });
        await writeFile(outputPath, JSON.stringify(ir, null, 2));

        console.log(`✅ Successfully generated DesignIR at ${outputPath}`);
        console.log(`   - Project Name: ${ir.projectName}`);
        console.log(`   - Screens: ${ir.screens.length}`);
        console.log(`   - Data Models: ${ir.dataModels.length}`);

    } catch (error) {
        console.error('❌ Error parsing design:', error);
        process.exit(1);
    }
}

main();
