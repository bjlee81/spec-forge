import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FrontendGenerator } from './generator.js';
import type { DesignIR } from '@figma-codegen/design-parser';
import { existsSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('FrontendGenerator', () => {
    const TEMP_DIR = join(process.cwd(), '.temp-frontend-test');

    const mockIR: DesignIR = {
        projectName: 'Test Project',
        flows: [],
        components: [],
        dataModels: [
            {
                name: 'User',
                fields: [
                    { name: 'id', type: 'INTEGER', required: true },
                    { name: 'username', type: 'STRING', required: false }
                ],
                relations: []
            }
        ],
        screens: [
            {
                id: 'screen-1',
                name: 'Dashboard (Main)',
                screenType: 'DASHBOARD',
                elements: [
                    {
                        id: 'el-1',
                        name: 'Title',
                        type: 'LABEL',
                        label: 'Welcome Dashboard'
                    },
                    {
                        id: 'el-2',
                        name: 'Save',
                        type: 'BUTTON',
                        label: 'Save Changes'
                    }
                ]
            }
        ]
    };

    beforeEach(() => {
        if (existsSync(TEMP_DIR)) {
            rmSync(TEMP_DIR, { recursive: true, force: true });
        }
    });

    afterEach(() => {
        if (existsSync(TEMP_DIR)) {
            rmSync(TEMP_DIR, { recursive: true, force: true });
        }
    });

    it('should generate html, css, and js files', async () => {
        const generator = new FrontendGenerator({ outputDir: TEMP_DIR });
        const generatedFiles = await generator.generate(mockIR);

        expect(generatedFiles.length).toBeGreaterThan(0);

        const indexHtmlPath = join(TEMP_DIR, 'index.html');
        const stylesCssPath = join(TEMP_DIR, 'styles.css');
        const appJsPath = join(TEMP_DIR, 'app.js');
        const screenHtmlPath = join(TEMP_DIR, 'dashboard-main.html');

        expect(existsSync(indexHtmlPath)).toBe(true);
        expect(existsSync(stylesCssPath)).toBe(true);
        expect(existsSync(appJsPath)).toBe(true);
        expect(existsSync(screenHtmlPath)).toBe(true);

        const indexContent = readFileSync(indexHtmlPath, 'utf-8');
        expect(indexContent).toContain('Test Project - Preview');
        expect(indexContent).toContain('href="dashboard-main.html"');

        const styleContent = readFileSync(stylesCssPath, 'utf-8');
        expect(styleContent).toContain('var(--primary)');

        const appJsContent = readFileSync(appJsPath, 'utf-8');
        expect(appJsContent).toContain('Test Project Preview loaded');
        expect(appJsContent).toContain('User');

        const screenContent = readFileSync(screenHtmlPath, 'utf-8');
        expect(screenContent).toContain('Welcome Dashboard');
        expect(screenContent).toContain('<button class="btn">Save Changes</button>');
    });
});
