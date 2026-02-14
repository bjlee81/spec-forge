/**
 * Design IR (Intermediate Representation) 타입 정의
 * Figma 데이터를 구조화된 형태로 변환한 중간 표현
 */

/** 전체 디자인 IR */
export interface DesignIR {
    /** 프로젝트 이름 */
    projectName: string;
    /** 화면 목록 */
    screens: Screen[];
    /** 추론된 데이터 모델 */
    dataModels: DataModel[];
    /** 화면 간 이동 관계 */
    flows: Flow[];
    /** 재사용 컴포넌트 */
    components: UIComponent[];
}

/** 화면 (Frame) 정보 */
export interface Screen {
    id: string;
    name: string;
    description?: string;
    /** 화면 내 UI 요소 목록 */
    elements: UIElement[];
    /** 화면의 기능적 유형 */
    screenType: ScreenType;
}

export type ScreenType =
    | 'LIST'       // 목록 (리스트/테이블/그리드)
    | 'DETAIL'     // 상세 보기
    | 'FORM'       // 입력/수정 폼
    | 'LOGIN'      // 로그인/인증
    | 'DASHBOARD'  // 대시보드
    | 'SETTINGS'   // 설정
    | 'OTHER';     // 기타

/** UI 요소 */
export interface UIElement {
    id: string;
    name: string;
    type: UIElementType;
    /** 라벨/플레이스홀더 텍스트 */
    label?: string;
    placeholder?: string;
    /** 데이터 바인딩 필드 이름 (추론) */
    dataField?: string;
    /** 하위 요소 */
    children?: UIElement[];
}

export type UIElementType =
    | 'TEXT_INPUT'
    | 'TEXT_AREA'
    | 'SELECT'
    | 'CHECKBOX'
    | 'RADIO'
    | 'BUTTON'
    | 'LINK'
    | 'IMAGE'
    | 'TABLE'
    | 'LIST'
    | 'CARD'
    | 'NAV'
    | 'HEADER'
    | 'FOOTER'
    | 'LABEL'
    | 'ICON'
    | 'CONTAINER';

/** 데이터 모델 (DB 엔티티) */
export interface DataModel {
    name: string;
    /** 모델 설명 */
    description?: string;
    /** 필드 목록 */
    fields: DataField[];
    /** 관계 */
    relations: DataRelation[];
}

/** 데이터 필드 */
export interface DataField {
    name: string;
    type: DataFieldType;
    required: boolean;
    /** 고유 제약조건 */
    unique?: boolean;
    /** 기본값 */
    defaultValue?: string;
    description?: string;
}

export type DataFieldType =
    | 'STRING'
    | 'TEXT'
    | 'INTEGER'
    | 'FLOAT'
    | 'BOOLEAN'
    | 'DATE'
    | 'DATETIME'
    | 'EMAIL'
    | 'URL'
    | 'PASSWORD'
    | 'ENUM'
    | 'JSON';

/** 데이터 관계 */
export interface DataRelation {
    /** 관계 대상 모델 이름 */
    targetModel: string;
    /** 관계 유형 */
    type: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_MANY';
    /** 외래키 필드명 */
    foreignKey?: string;
}

/** 화면 간 이동 */
export interface Flow {
    /** 출발 화면 ID */
    fromScreenId: string;
    /** 도착 화면 ID */
    toScreenId: string;
    /** 트리거 설명 */
    trigger: string;
    /** HTTP 메서드 힌트 */
    httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
}

/** 재사용 UI 컴포넌트 */
export interface UIComponent {
    id: string;
    name: string;
    /** 사용된 화면 ID 목록 */
    usedInScreens: string[];
    /** 프로퍼티 */
    properties: ComponentProp[];
}

export interface ComponentProp {
    name: string;
    type: 'string' | 'number' | 'boolean';
    required: boolean;
}
