/**
 * Figma MCP/API 응답에서 추출되는 기본 타입 정의
 */

/** Figma 파일 전체 구조 */
export interface FigmaFile {
    name: string;
    lastModified: string;
    version: string;
    document: FigmaNode;
}

/** Figma 노드 (모든 요소의 기본) */
export interface FigmaNode {
    id: string;
    name: string;
    type: FigmaNodeType;
    children?: FigmaNode[];
    // 레이아웃 속성
    absoluteBoundingBox?: BoundingBox;
    constraints?: Constraints;
    layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
    // 스타일 속성
    fills?: Paint[];
    strokes?: Paint[];
    effects?: Effect[];
    // 텍스트 속성
    characters?: string;
    style?: TypeStyle;
    // 컴포넌트 속성
    componentId?: string;
    componentProperties?: Record<string, ComponentProperty>;
}

export type FigmaNodeType =
    | 'DOCUMENT'
    | 'CANVAS'
    | 'FRAME'
    | 'GROUP'
    | 'COMPONENT'
    | 'COMPONENT_SET'
    | 'INSTANCE'
    | 'TEXT'
    | 'RECTANGLE'
    | 'ELLIPSE'
    | 'VECTOR'
    | 'LINE'
    | 'BOOLEAN_OPERATION'
    | 'SECTION';

export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Constraints {
    vertical: string;
    horizontal: string;
}

export interface Paint {
    type: string;
    color?: Color;
    opacity?: number;
    visible?: boolean;
}

export interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
}

export interface Effect {
    type: string;
    visible: boolean;
    radius?: number;
    color?: Color;
    offset?: { x: number; y: number };
}

export interface TypeStyle {
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    lineHeightPx?: number;
    letterSpacing?: number;
    textAlignHorizontal?: string;
}

export interface ComponentProperty {
    type: string;
    value: string | boolean | number;
}

/** Figma 컴포넌트 메타데이터 */
export interface FigmaComponent {
    key: string;
    name: string;
    description: string;
    documentationLinks?: string[];
}

/** Figma 스타일 메타데이터 */
export interface FigmaStyle {
    key: string;
    name: string;
    styleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';
    description: string;
}
