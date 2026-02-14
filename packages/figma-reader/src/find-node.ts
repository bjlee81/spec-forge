import 'dotenv/config';
import { FigmaReader } from './reader.js';
import type { FigmaNode } from './types.js';

async function main() {
    const searchTerms = process.argv.slice(2);
    const fileKey = process.env.TEST_FIGMA_FILE_KEY;

    if (searchTerms.length === 0 || !fileKey) {
        console.error('Usage: tsx src/find-node.ts <term1> [term2] ...');
        process.exit(1);
    }

    console.log(`Searching for nodes matching [${searchTerms.join(', ')}] in file ${fileKey}...`);

    try {
        const reader = new FigmaReader();
        const file = await reader.readFile(fileKey);

        const foundNodes: { id: string, name: string, type: string }[] = [];

        function traverse(node: FigmaNode) {
            const nodeNameLower = node.name.toLowerCase();
            const isMatch = searchTerms.some(term => nodeNameLower.includes(term.toLowerCase()));
            const isContainer = ['FRAME', 'CANVAS', 'SECTION'].includes(node.type);

            if (isMatch && isContainer) {
                foundNodes.push({ id: node.id, name: node.name, type: node.type });
            }

            if ('children' in node && Array.isArray(node.children)) {
                for (const child of node.children) {
                    traverse(child);
                }
            }
        }

        traverse(file.document);

        if (foundNodes.length === 0) {
            console.log('❌ No nodes found with those names.');
        } else {
            console.log(`✅ Found ${foundNodes.length} nodes:`);
            foundNodes.forEach(node => {
                console.log(`   - [${node.type}] "${node.name}" (ID: ${node.id})`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
