import 'dotenv/config';
import { FigmaReader } from './reader.js';

async function main() {
    const nodeId = process.argv[2];
    const fileKey = process.env.TEST_FIGMA_FILE_KEY;

    if (!nodeId || !fileKey) {
        console.error('Usage: tsx src/list-children.ts <node-id>');
        process.exit(1);
    }

    console.log(`Listing children for node ${nodeId} in file ${fileKey}...`);

    try {
        const reader = new FigmaReader();
        // Note: readFile fetches the whole file. 
        // readNode fetches a specific node but might be slower if we already have the file cached or if we want to traverse deep.
        // For now, let's use readNode as it seems more appropriate for "children of a node".
        // HOWEVER, readNode in reader.ts uses /v1/files/:key/nodes?ids=:ids
        // which returns the node logic.

        const node = await reader.readNode(fileKey, nodeId);

        console.log(`Node: [${node.type}] "${node.name}" (ID: ${node.id})`);

        if ('children' in node && Array.isArray(node.children)) {
            console.log(`Children (${node.children.length}):`);
            const children = node.children as any[];
            children.forEach(child => {
                console.log(`- [${child.type}] "${child.name}" (ID: ${child.id})`);
            });
        } else {
            console.log('No children found or not a container node.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
