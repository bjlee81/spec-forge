import { describe, it, expect } from 'vitest';
import { DesignParser } from './parser.js';
import type { DesignIR } from './types.js';
import type { FigmaFile, FigmaNode } from '@figma-codegen/figma-reader';

/** 테스트용 Figma 파일 데이터 생성 */
function createMockFigmaFile(frames: Partial<FigmaNode>[] = []): FigmaFile {
    return {
        name: 'Test Project',
        lastModified: '2026-01-01T00:00:00Z',
        version: '1',
        document: {
            id: '0:0',
            name: 'Document',
            type: 'DOCUMENT',
            children: [
                {
                    id: '0:1',
                    name: 'Page 1',
                    type: 'CANVAS',
                    children: frames.map((f, i) => ({
                        id: `1:${i}`,
                        name: f.name || `Frame ${i}`,
                        type: 'FRAME' as const,
                        children: f.children || [],
                        ...f,
                    })),
                },
            ],
        },
    };
}

describe('DesignParser', () => {
    const parser = new DesignParser();

    describe('parse', () => {
        it('빈 Figma 파일에서 빈 IR을 반환해야 한다', () => {
            const file = createMockFigmaFile();
            const ir = parser.parse(file);

            expect(ir.projectName).toBe('Test Project');
            expect(ir.screens).toHaveLength(0);
            expect(ir.dataModels).toHaveLength(0);
        });

        it('Frame을 Screen으로 추출해야 한다', () => {
            const file = createMockFigmaFile([
                { name: 'Login Page' },
                { name: 'User List' },
            ]);

            const ir = parser.parse(file);

            expect(ir.screens).toHaveLength(2);
            expect(ir.screens[0].name).toBe('Login Page');
            expect(ir.screens[1].name).toBe('User List');
        });

        it('화면 이름에서 ScreenType을 추론해야 한다', () => {
            const file = createMockFigmaFile([
                { name: 'Login Page' },
                { name: 'User List' },
                { name: 'User Detail' },
                { name: 'User Create Form' },
                { name: 'Dashboard' },
                { name: 'Settings' },
            ]);

            const ir = parser.parse(file);

            expect(ir.screens[0].screenType).toBe('LOGIN');
            expect(ir.screens[1].screenType).toBe('LIST');
            expect(ir.screens[2].screenType).toBe('DETAIL');
            expect(ir.screens[3].screenType).toBe('FORM');
            expect(ir.screens[4].screenType).toBe('DASHBOARD');
            expect(ir.screens[5].screenType).toBe('SETTINGS');
        });

        it('입력 필드에서 데이터 모델을 추론해야 한다', () => {
            const file = createMockFigmaFile([
                {
                    name: 'User Create Form',
                    children: [
                        { id: 'f1', name: 'Email Input', type: 'FRAME' as const, children: [] },
                        { id: 'f2', name: 'Password Input', type: 'FRAME' as const, children: [] },
                        { id: 'f3', name: 'Name Input', type: 'FRAME' as const, children: [] },
                    ],
                },
            ]);

            const ir = parser.parse(file);

            expect(ir.dataModels.length).toBeGreaterThan(0);
            const userModel = ir.dataModels.find(m => m.name === 'User');
            expect(userModel).toBeDefined();
            expect(userModel!.fields.some(f => f.name.toLowerCase().includes('email'))).toBe(true);
        });

        it('UI 요소 타입을 올바르게 추론해야 한다', () => {
            const file = createMockFigmaFile([
                {
                    name: 'Test Screen',
                    children: [
                        { id: 'b1', name: 'Submit Button', type: 'FRAME' as const, children: [] },
                        { id: 't1', name: 'Title', type: 'TEXT' as const, characters: 'Hello', children: undefined },
                        { id: 'i1', name: 'Profile Image', type: 'FRAME' as const, children: [] },
                    ],
                },
            ]);

            const ir = parser.parse(file);
            const elements = ir.screens[0].elements;

            expect(elements.find(e => e.name === 'Submit Button')?.type).toBe('BUTTON');
            expect(elements.find(e => e.name === 'Title')?.type).toBe('LABEL');
            expect(elements.find(e => e.name === 'Profile Image')?.type).toBe('IMAGE');
        });
    });
});
