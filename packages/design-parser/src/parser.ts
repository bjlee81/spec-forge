import type { FigmaFile, FigmaNode } from '@figma-codegen/figma-reader';
import type { DesignIR, Screen, DataModel, UIElement, UIElementType, ScreenType } from './types.js';

/**
 * Figma 데이터를 Design IR로 변환하는 파서
 */
export class DesignParser {
    /**
     * Figma 파일 데이터를 Design IR로 변환합니다.
     */
    parse(figmaFile: FigmaFile): DesignIR {
        const screens = this.extractScreens(figmaFile.document);
        const dataModels = this.inferDataModels(screens);

        return {
            projectName: figmaFile.name,
            screens,
            dataModels,
            flows: [],
            components: [],
        };
    }

    /**
     * Figma 노드 트리에서 화면(Frame)들을 추출합니다.
     */
    private extractScreens(document: FigmaNode): Screen[] {
        const screens: Screen[] = [];

        // CASE 1: The document itself is a Screen (FRAME/SECTION/COMPONENT) from extract-node.ts
        if (document.type === 'FRAME' || document.type === 'COMPONENT' || document.type === 'SECTION') {
            screens.push({
                id: document.id,
                name: document.name,
                elements: this.extractElements(document),
                screenType: this.inferScreenType(document),
            });
            return screens;
        }

        // CASE 2: The document is a full File or CANVAS, iterate deeper
        if (document.children) {
            // If it's a CANVAS, just check its children
            if (document.type === 'CANVAS') {
                for (const frame of document.children) {
                    if (frame.type === 'FRAME' || frame.type === 'COMPONENT' || frame.type === 'SECTION') {
                        screens.push({
                            id: frame.id,
                            name: frame.name,
                            elements: this.extractElements(frame),
                            screenType: this.inferScreenType(frame),
                        });
                    }
                }
                return screens;
            }

            // If it's a DOCUMENT (Root), iterate through CANVAS children
            for (const page of document.children) {
                if (page.type === 'CANVAS' && page.children) {
                    for (const frame of page.children) {
                        if (frame.type === 'FRAME' || frame.type === 'COMPONENT' || frame.type === 'SECTION') {
                            screens.push({
                                id: frame.id,
                                name: frame.name,
                                elements: this.extractElements(frame),
                                screenType: this.inferScreenType(frame),
                            });
                        }
                    }
                }
            }
        }

        return screens;
    }

    /**
     * 노드에서 UI 요소를 재귀적으로 추출합니다.
     */
    private extractElements(node: FigmaNode): UIElement[] {
        const elements: UIElement[] = [];

        if (!node.children) return elements;

        for (const child of node.children) {
            const elementType = this.inferElementType(child);
            const element: UIElement = {
                id: child.id,
                name: child.name,
                type: elementType,
                label: child.type === 'TEXT' ? child.characters : undefined,
                styles: this.inferStyles(child),
                children: child.children ? this.extractElements(child) : undefined,
            };

            // 입력 필드인 경우 데이터 필드 이름 추론
            if (['TEXT_INPUT', 'TEXT_AREA', 'SELECT', 'CHECKBOX', 'RADIO'].includes(elementType)) {
                element.dataField = this.inferDataFieldName(child.name);
                element.placeholder = this.findPlaceholderText(child);
            }

            elements.push(element);
        }

        return elements;
    }

    /**
     * Figma 노드 이름과 구조에서 UI 요소 타입을 추론합니다.
     */
    private inferElementType(node: FigmaNode): UIElementType {
        const name = node.name.toLowerCase();

        if (name.includes('input') || name.includes('text field') || name.includes('textfield')) return 'TEXT_INPUT';
        if (name.includes('textarea') || name.includes('text area')) return 'TEXT_AREA';
        if (name.includes('select') || name.includes('dropdown') || name.includes('combo')) return 'SELECT';
        if (name.includes('checkbox') || name.includes('check box')) return 'CHECKBOX';
        if (name.includes('radio')) return 'RADIO';
        if (name.includes('button') || name.includes('btn') || name.includes('cta')) return 'BUTTON';
        if (name.includes('link') || name.includes('anchor')) return 'LINK';
        if (name.includes('image') || name.includes('img') || name.includes('photo') || name.includes('avatar')) return 'IMAGE';
        if (name.includes('table')) return 'TABLE';
        if (name.includes('list')) return 'LIST';
        if (name.includes('card')) return 'CARD';
        if (name.includes('nav') || name.includes('menu') || name.includes('sidebar')) return 'NAV';
        if (name.includes('header')) return 'HEADER';
        if (name.includes('footer')) return 'FOOTER';
        if (name.includes('icon')) return 'ICON';
        if (node.type === 'TEXT') return 'LABEL';

        return 'CONTAINER';
    }

    /**
     * 화면 이름에서 화면 유형을 추론합니다.
     */
    private inferScreenType(node: FigmaNode): ScreenType {
        const name = node.name.toLowerCase();

        if (name.includes('login') || name.includes('sign in') || name.includes('signup') || name.includes('register')) return 'LOGIN';
        if (name.includes('list') || name.includes('목록') || name.includes('table')) return 'LIST';
        if (name.includes('detail') || name.includes('상세') || name.includes('view')) return 'DETAIL';
        if (name.includes('form') || name.includes('edit') || name.includes('create') || name.includes('new') || name.includes('등록') || name.includes('수정')) return 'FORM';
        if (name.includes('dashboard') || name.includes('home') || name.includes('main')) return 'DASHBOARD';
        if (name.includes('setting') || name.includes('config') || name.includes('설정')) return 'SETTINGS';

        return 'OTHER';
    }

    /**
     * 노드 속성으로부터 CSS 스타일을 추출합니다.
     */
    private inferStyles(node: FigmaNode): Record<string, string> {
        const styles: Record<string, string> = {};

        // 1. 레이아웃 & 크기
        if (node.absoluteBoundingBox) {
            styles['width'] = `${node.absoluteBoundingBox.width}px`;
            styles['height'] = `${node.absoluteBoundingBox.height}px`;
            // 절대 배치 옵션 (부모를 파악하기 어려우므로 relative로 처리하거나 디자인 툴 기반으로 position 정해야하나 일단 크기만)
        }

        // 2. 색상 (Fills)
        if (node.fills && node.fills.length > 0) {
            const fill = node.fills.find(f => f.type === 'SOLID' && f.visible !== false);
            if (fill && fill.color) {
                const { r, g, b, a } = fill.color;
                const opacity = fill.opacity !== undefined ? fill.opacity : (a !== undefined ? a : 1);
                styles['background-color'] = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${opacity})`;
            }
        }

        // 3. 폰트/텍스트 스타일
        if (node.type === 'TEXT' && node.style) {
            if (node.style.fontSize) styles['font-size'] = `${node.style.fontSize}px`;
            if (node.style.fontWeight) styles['font-weight'] = `${node.style.fontWeight}`;
            if (node.style.fontFamily) styles['font-family'] = `"${node.style.fontFamily}", sans-serif`;
            if (node.style.lineHeightPx) styles['line-height'] = `${node.style.lineHeightPx}px`;
            if (node.style.letterSpacing) styles['letter-spacing'] = `${node.style.letterSpacing}px`;

            if (node.style.textAlignHorizontal) {
                const alignMap: Record<string, string> = {
                    'LEFT': 'left',
                    'CENTER': 'center',
                    'RIGHT': 'right',
                    'JUSTIFIED': 'justify'
                };
                styles['text-align'] = alignMap[node.style.textAlignHorizontal] || 'left';
            }
        }

        // 4. 보더 (Strokes)
        if (node.strokes && node.strokes.length > 0) {
            const stroke = node.strokes.find(s => s.type === 'SOLID' && s.visible !== false);
            if (stroke && stroke.color) {
                const { r, g, b, a } = stroke.color;
                const opacity = stroke.opacity !== undefined ? stroke.opacity : (a !== undefined ? a : 1);
                styles['border'] = `1px solid rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${opacity})`;
            }
        }

        // 5. 모서리 곡률 등 모형 (예: radius가 있다면 처리해야 함 - 일단 IR에 radius가 없으면 skip)

        return styles;
    }

    /**
     * 노드 이름에서 데이터 필드명을 추론합니다.
     * 예: "Email Input" → "email", "User Name Field" → "userName"
     */
    private inferDataFieldName(nodeName: string): string {
        return nodeName
            .replace(/input|field|text|area|select|dropdown|checkbox|radio/gi, '')
            .trim()
            .replace(/\s+(.)/g, (_, c: string) => c.toUpperCase())
            .replace(/^\w/, c => c.toLowerCase())
            .replace(/[^a-zA-Z0-9]/g, '');
    }

    /**
     * 텍스트 자식 노드에서 플레이스홀더 텍스트를 찾습니다.
     */
    private findPlaceholderText(node: FigmaNode): string | undefined {
        if (node.type === 'TEXT' && node.characters) {
            return node.characters;
        }
        if (node.children) {
            for (const child of node.children) {
                const text = this.findPlaceholderText(child);
                if (text) return text;
            }
        }
        return undefined;
    }

    /**
     * 화면의 입력 필드들을 분석하여 데이터 모델을 추론합니다.
     */
    private inferDataModels(screens: Screen[]): DataModel[] {
        const models: DataModel[] = [];

        for (const screen of screens) {
            if (screen.screenType === 'FORM' || screen.screenType === 'DETAIL' || screen.screenType === 'DASHBOARD') {
                const fields = this.collectInputFields(screen.elements);
                if (fields.length > 0) {
                    const modelName = this.inferModelName(screen.name);

                    // Deduplicate fields within the model
                    const uniqueFields: any[] = [];
                    const nameCount = new Map<string, number>();

                    for (const f of fields) {
                        // Priority: dataField -> name -> label
                        let rawName = f.dataField || f.name;
                        let fieldName = this.toCamelCase(rawName);

                        // Handle duplicates
                        if (nameCount.has(fieldName)) {
                            const count = nameCount.get(fieldName)! + 1;
                            nameCount.set(fieldName, count);
                            fieldName = `${fieldName}${count}`; // camelCase: fieldName2
                        } else {
                            nameCount.set(fieldName, 1);
                        }

                        uniqueFields.push({
                            name: fieldName,
                            type: this.inferFieldType(f),
                            required: true,
                        });
                    }

                    models.push({
                        name: modelName,
                        description: `${screen.name} 화면에서 추론된 모델`,
                        fields: uniqueFields,
                        relations: [],
                    });
                }
            }
        }

        return this.deduplicateModels(models);
    }

    /**
     * UI 요소에서 입력 필드만 재귀적으로 수집합니다.
     */
    private collectInputFields(elements: UIElement[]): UIElement[] {
        const fields: UIElement[] = [];
        for (const el of elements) {
            if (['TEXT_INPUT', 'TEXT_AREA', 'SELECT', 'CHECKBOX', 'RADIO'].includes(el.type)) {
                fields.push(el);
            }
            if (el.children) {
                fields.push(...this.collectInputFields(el.children));
            }
        }
        return fields;
    }

    /**
     * 화면 이름에서 모델 이름을 추론합니다. (PascalCase)
     */
    private inferModelName(screenName: string): string {
        // 1. Remove common prefixes/suffixes
        // 2. Remove special characters
        // 3. To PascalCase
        const cleaned = screenName
            .replace(/form|edit|create|new|list|detail|view|등록|수정|상세|목록/gi, '')
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .trim();

        if (!cleaned) return 'Entity';

        return cleaned
            .split(/\s+/)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join('');
    }

    /**
     * 문자열을 CamelCase로 변환합니다.
     */
    private toCamelCase(str: string): string {
        return str
            .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars
            .trim()
            .split(/\s+/)
            .map((w, i) => {
                if (i === 0) return w.toLowerCase();
                return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
            })
            .join('');
    }

    /**
     * UI 요소로부터 데이터 필드 타입을 추론합니다.
     */
    private inferFieldType(element: UIElement): 'STRING' | 'TEXT' | 'BOOLEAN' | 'EMAIL' | 'PASSWORD' | 'DATE' {
        const name = (element.dataField || element.name).toLowerCase();

        if (name.includes('email')) return 'EMAIL';
        if (name.includes('password') || name.includes('pw')) return 'PASSWORD';
        if (name.includes('date') || name.includes('날짜')) return 'DATE';
        if (element.type === 'CHECKBOX') return 'BOOLEAN';
        if (element.type === 'TEXT_AREA') return 'TEXT';
        return 'STRING';
    }

    /**
     * 같은 이름의 모델을 병합합니다.
     */
    private deduplicateModels(models: DataModel[]): DataModel[] {
        const map = new Map<string, DataModel>();
        for (const model of models) {
            const existing = map.get(model.name);
            if (existing) {
                // 필드 병합
                const existingFieldNames = new Set(existing.fields.map(f => f.name));
                for (const field of model.fields) {
                    if (!existingFieldNames.has(field.name)) {
                        existing.fields.push(field);
                    }
                }
            } else {
                map.set(model.name, { ...model });
            }
        }
        return Array.from(map.values());
    }
}
