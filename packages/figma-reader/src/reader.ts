import type { FigmaFile, FigmaNode } from './types.js';

export interface FigmaReaderOptions {
    /** Figma Personal Access Token. If not provided, will look for FIGMA_ACCESS_TOKEN env var. */
    accessToken?: string;
    /** MCP 서버 사용 여부 (false일 경우 REST API fallback) */
    useMcp?: boolean;
}

/**
 * Figma 파일을 MCP 또는 REST API를 통해 읽어오는 클래스
 */
export class FigmaReader {
    private readonly accessToken: string;
    private readonly useMcp: boolean;

    constructor(options: FigmaReaderOptions = {}) {
        const token = options.accessToken || process.env.FIGMA_ACCESS_TOKEN;
        if (!token) {
            throw new Error('Figma Access Token is required. Provide it in options or set FIGMA_ACCESS_TOKEN env var.');
        }
        this.accessToken = token;
        this.useMcp = options.useMcp || false;
    }

    /**
     * Figma 파일 전체를 읽어옵니다.
     * @param fileKey Figma 파일 키 (URL에서 추출)
     */
    async readFile(fileKey: string): Promise<FigmaFile> {
        return this.readFileViaRestApi(fileKey);
    }

    /**
     * 특정 노드의 상세 정보를 읽어옵니다.
     * @param fileKey Figma 파일 키
     * @param nodeId 노드 ID
     */
    async readNode(fileKey: string, nodeId: string): Promise<FigmaNode> {
        const url = `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${nodeId}`;
        const response = await fetch(url, {
            headers: {
                'X-FIGMA-TOKEN': this.accessToken,
            },
        });

        if (!response.ok) {
            throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json() as any;
        const nodes = data.nodes as Record<string, { document: FigmaNode }>;
        const node = nodes[nodeId];

        if (!node) {
            throw new Error(`Node ${nodeId} not found in file ${fileKey}`);
        }

        return node.document;
    }

    /**
     * REST API를 통해 Figma 파일을 읽어옵니다.
     */
    private async readFileViaRestApi(fileKey: string): Promise<FigmaFile> {
        const url = `https://api.figma.com/v1/files/${fileKey}`;
        const response = await fetch(url, {
            headers: {
                'X-FIGMA-TOKEN': this.accessToken,
            },
        });

        if (!response.ok) {
            throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json() as any;
        return data as FigmaFile;
    }
}
