import 'dotenv/config';
import { FigmaReader } from './reader.js';
import { writeFile } from 'node:fs/promises';

async function main() {
    const fileKey = process.argv[2] || process.env.TEST_FIGMA_FILE_KEY;

    if (!fileKey) {
        console.error('Usage: tsx src/fetch-design.ts <file-key>');
        console.error('Or set TEST_FIGMA_FILE_KEY in .env file');
        process.exit(1);
    }

    console.log(`Fetching Figma file: ${fileKey}`);

    try {
        const reader = new FigmaReader();
        // 전체 파일을 메모리에 올리는 것은 위험할 수 있으므로, 메타데이터만 먼저 확인하거나
        // 여기서는 일단 성공 여부만 봅니다.
        const design = await reader.readFile(fileKey);

        console.log(`✅ Successfully fetched design!`);
        console.log(`   - Document Name: ${design.name}`);
        console.log(`   - Last Modified: ${design.lastModified}`);
        console.log(`   - Root Nodes:    ${design.document.children.length}`);
        console.log(`   - Version:       ${design.version}`);

        // 파일 저장이 메모리 초과를 일으킬 수 있으므로, 크기만 로그로 남깁니다.
        // const outputFile = `figma-${fileKey}.json`;
        // await writeFile(outputFile, JSON.stringify(design, null, 2)); 
        // console.log(`(Skipped saving full JSON due to size potential)`);

    } catch (error) {
        console.error('❌ Error fetching design:', error);
        if (error instanceof Error && error.message.includes('403')) {
            console.error('   Hint: Check if your FIGMA_ACCESS_TOKEN is correct and has access to this file.');
        } else if (error instanceof Error && error.message.includes('404')) {
            console.error('   Hint: Check if the File Key is correct.');
        }
        process.exit(1);
    }
}

main();
