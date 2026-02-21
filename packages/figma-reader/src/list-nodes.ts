import 'dotenv/config';
import { FigmaReader } from './reader.js';

async function main() {
    const fileKey = process.env.TEST_FIGMA_FILE_KEY;
    if (!fileKey) return;

    console.log(`Listing root nodes for file ${fileKey}...`);
    try {
        const reader = new FigmaReader();
        const file = await reader.readFile(fileKey);

        file.document.children.forEach(node => {
            console.log(`- [${node.type}] "${node.name}" (ID: ${node.id})`);
            if ('children' in node && Array.isArray(node.children)) {
                // 1-level deep
                node.children.forEach(child => {
                    console.log(`  - [${child.type}] "${child.name}" (ID: ${child.id})`);
                });
            }
        });
    } catch (error) {
        console.error(error);
    }
}
main();
