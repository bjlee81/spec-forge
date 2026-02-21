import 'dotenv/config';
import { FigmaReader } from './reader.js';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

async function main() {
    const nodeId = process.argv[2];
    const outputPath = process.argv[3];
    const fileKey = process.env.TEST_FIGMA_FILE_KEY;

    if (!nodeId || !outputPath || !fileKey) {
        console.error('Usage: tsx src/extract-node.ts <node-id> <output-json-path>');
        process.exit(1);
    }

    console.log(`Extracting node ${nodeId} from file ${fileKey}...`);

    try {
        const reader = new FigmaReader();
        const node = await reader.readNode(fileKey, nodeId);

        await mkdir(dirname(outputPath), { recursive: true });
        await writeFile(outputPath, JSON.stringify(node, null, 2));

        console.log(`✅ Successfully saved node data to ${outputPath}`);
        console.log(`   - Name: ${node.name}`);
        console.log(`   - Type: ${node.type}`);
        if ('children' in node && Array.isArray(node.children)) {
            console.log(`   - Children: ${node.children.length}`);
        }
    } catch (error) {
        console.error('❌ Error extracting node:', error);
        process.exit(1);
    }
}

main();
