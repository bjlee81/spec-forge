import type { DesignIR, Screen, UIElement } from '@figma-codegen/design-parser';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export interface FrontendGenOptions {
  /** 출력 디렉토리 */
  outputDir: string;
}

/**
 * Design IR에서 테스트 가능한 HTML/CSS/JS Frontend를 생성합니다.
 */
export class FrontendGenerator {
  private readonly options: FrontendGenOptions;

  constructor(options: FrontendGenOptions) {
    this.options = options;
  }

  /**
   * Design IR에서 Frontend 파일들을 생성합니다.
   */
  async generate(ir: DesignIR): Promise<string[]> {
    await mkdir(this.options.outputDir, { recursive: true });

    const generatedFiles: string[] = [];

    // index.html 생성
    const indexHtml = this.generateIndexHtml(ir);
    const indexPath = join(this.options.outputDir, 'index.html');
    await writeFile(indexPath, indexHtml, 'utf-8');
    generatedFiles.push(indexPath);

    // styles.css 생성
    const css = this.generateCSS(ir);
    const cssPath = join(this.options.outputDir, 'styles.css');
    await writeFile(cssPath, css, 'utf-8');
    generatedFiles.push(cssPath);

    // app.js 생성
    const js = this.generateJS(ir);
    const jsPath = join(this.options.outputDir, 'app.js');
    await writeFile(jsPath, js, 'utf-8');
    generatedFiles.push(jsPath);

    // 각 화면별 HTML 생성
    for (const screen of ir.screens) {
      const screenHtml = this.generateScreenHtml(screen);
      const screenPath = join(this.options.outputDir, `${this.slugify(screen.name)}.html`);
      await writeFile(screenPath, screenHtml, 'utf-8');
      generatedFiles.push(screenPath);
    }

    return generatedFiles;
  }

  /**
   * 메인 index.html을 생성합니다.
   */
  generateIndexHtml(ir: DesignIR): string {
    const navLinks = ir.screens
      .map(s => `    <li><a href="${this.slugify(s.name)}.html">${s.name}</a></li>`)
      .join('\n');

    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ir.projectName} - Preview</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <h1>${ir.projectName}</h1>
    <p>Generated Frontend Preview</p>
  </header>
  <nav>
    <h2>화면 목록</h2>
    <ul>
${navLinks}
    </ul>
  </nav>
  <main id="app"></main>
  <script src="app.js"></script>
</body>
</html>`;
  }

  /**
   * 기본 CSS를 생성합니다.
   */
  generateCSS(_ir: DesignIR): string {
    return `/* Auto-generated CSS */
:root {
  --primary: #3b82f6;
  --primary-hover: #2563eb;
  --bg: #f8fafc;
  --surface: #ffffff;
  --text: #1e293b;
  --text-muted: #64748b;
  --border: #e2e8f0;
  --radius: 8px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
}

header {
  background: var(--primary);
  color: white;
  padding: 1.5rem 2rem;
}

header h1 { font-size: 1.5rem; }
header p { opacity: 0.8; font-size: 0.9rem; }

nav {
  background: var(--surface);
  padding: 1rem 2rem;
  border-bottom: 1px solid var(--border);
}

nav h2 { font-size: 1rem; margin-bottom: 0.5rem; color: var(--text-muted); }
nav ul { list-style: none; display: flex; gap: 1rem; flex-wrap: wrap; }
nav a { color: var(--primary); text-decoration: none; padding: 0.25rem 0.75rem; border-radius: var(--radius); }
nav a:hover { background: var(--primary); color: white; }

main { padding: 2rem; max-width: 1200px; margin: 0 auto; }

.screen { background: var(--surface); border-radius: var(--radius); padding: 2rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.screen h2 { font-size: 1.25rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary); }
.screen-canvas { position: relative; width: 100%; min-height: 1000px; background: transparent; }

.form-group { margin-bottom: 1rem; pointer-events: auto; }
.form-group label { display: block; margin-bottom: 0.25rem; font-weight: 500; font-size: 0.9rem; pointer-events: none; }
.form-group input, .form-group textarea, .form-group select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 0.9rem;
  pointer-events: auto;
  position: relative;
  z-index: 10;
}

.btn {
  display: inline-block;
  padding: 0.5rem 1.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 0.9rem;
  pointer-events: auto;
  position: relative;
  z-index: 10;
}

.btn:hover { background: var(--primary-hover); }

/* Ensure overlapping absolute containers do not block clicks */
.container { pointer-events: none; }
.container > * { pointer-events: auto; }
.screen-canvas * { pointer-events: none; }
.screen-canvas input, .screen-canvas select, .screen-canvas textarea, .screen-canvas button, .screen-canvas .table-container, .screen-canvas .form-group { pointer-events: auto; }

table { width: 100%; border-collapse: collapse; }
th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid var(--border); }
th { background: var(--bg); font-weight: 600; font-size: 0.85rem; text-transform: uppercase; }
`;
  }

  generateJS(ir: DesignIR): string {
    const mockData = this.generateMockData(ir);

    // 백엔드 API 엔드포인트 매핑 생성 (kebab-case 복수형 변환)
    const endpoints: Record<string, string> = {};
    for (const model of ir.dataModels) {
      endpoints[model.name] = `/api/v1/${this.pluralize(this.toKebabCase(model.name))}`;
    }

    return `// Auto-generated JavaScript
const API_BASE_URL = 'http://localhost:8080';
const mockData = ${JSON.stringify(mockData, null, 2)};
const endpoints = ${JSON.stringify(endpoints, null, 2)};

console.log('${ir.projectName} Preview loaded');
console.log('Available models:', Object.keys(endpoints));

/**
 * 데이터를 가져옵니다.
 */
async function fetchData(modelName) {
    const endpoint = endpoints[modelName];
    if (!endpoint) {
        console.error('Unknown model:', modelName);
        return;
    }
    try {
        console.log(\`Fetching \${modelName} from \${API_BASE_URL}\${endpoint}...\`);
        const response = await fetch(\`\${API_BASE_URL}\${endpoint}\`);
        if (!response.ok) throw new Error(\`HTTP error! status: \${response.status}\`);
        const data = await response.json();
        console.log('Received data:', data);
        return data;
    } catch (error) {
        console.error('Fetch failed, using mock data fallback.', error);
        return mockData[modelName] || [];
    }
}

/**
 * 데이터를 저장합니다.
 */
async function saveData(modelName, data) {
    const endpoint = endpoints[modelName];
    if (!endpoint) return;
    try {
        console.log(\`Saving \${modelName} to \${API_BASE_URL}\${endpoint}...\`);
        const response = await fetch(\`\${API_BASE_URL}\${endpoint}\`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(\`HTTP error! status: \${response.status}\`);
        const result = await response.json();
        console.log('Saved successfully:', result);
        return result;
    } catch (error) {
        console.error('Save failed.', error);
    }
}

// 초기 로딩 테스트 (존재하는 모델 하나를 임의로 fetch)
if (Object.keys(endpoints).length > 0) {
    const firestModel = Object.keys(endpoints)[0];
    fetchData(firestModel);
}
`;
  }

  /**
   * 각 화면별 HTML 파일을 생성합니다.
   */
  generateScreenHtml(screen: Screen): string {
    const elementsHtml = this.renderElements(screen.elements);

    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${screen.name}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <h1>${screen.name}</h1>
    <p>Screen Type: ${screen.screenType}</p>
  </header>
  <nav><a href="index.html">← 목록으로</a></nav>
  <main>
    <div class="screen">
      <h2>${screen.name}</h2>
      <div class="screen-canvas">
${elementsHtml}
      </div>
    </div>
  </main>
  <script src="app.js"></script>
</body>
</html>`;
  }

  /**
   * UI 요소들을 HTML로 렌더링합니다.
   */
  private renderElements(elements: UIElement[], indent = 6): string {
    const pad = ' '.repeat(indent);
    return elements
      .map(el => this.renderElement(el, pad))
      .filter(Boolean)
      .join('\n');
  }

  private renderElement(el: UIElement, pad: string): string {
    const styleAttr = el.styles && Object.keys(el.styles).length > 0
      ? ` style="${Object.entries(el.styles).map(([k, v]) => `${k}: ${v}`).join('; ')};"`
      : '';

    switch (el.type) {
      case 'TEXT_INPUT':
        return `${pad}<div class="form-group"${styleAttr}>
${pad}  <label>${el.label || el.name}</label>
${pad}  <input type="text" placeholder="${el.placeholder || ''}" name="${el.dataField || el.name}">
${pad}</div>`;
      case 'TEXT_AREA':
        return `${pad}<div class="form-group"${styleAttr}>
${pad}  <label>${el.label || el.name}</label>
${pad}  <textarea placeholder="${el.placeholder || ''}" name="${el.dataField || el.name}" rows="4"></textarea>
${pad}</div>`;
      case 'SELECT':
        return `${pad}<div class="form-group"${styleAttr}>
${pad}  <label>${el.label || el.name}</label>
${pad}  <select name="${el.dataField || el.name}"><option>-- 선택 --</option></select>
${pad}</div>`;
      case 'CHECKBOX':
        return `${pad}<div class="form-group"${styleAttr}>
${pad}  <label><input type="checkbox" name="${el.dataField || el.name}"> ${el.label || el.name}</label>
${pad}</div>`;
      case 'BUTTON':
        // 임의의 모델로 save 하도록 유도하는 샘플 onclick 함수
        return `${pad}<button class="btn"${styleAttr} onclick="saveData('PlaceholderModel', { sample: 'data' })">${el.label || el.name}</button>`;
      case 'LABEL':
        return `${pad}<p${styleAttr}>${el.label || el.name}</p>`;
      case 'TABLE':
        // 테이블의 로딩 트리거 요소
        return `${pad}<div class="table-container"${styleAttr}>\n${pad}  <table><thead><tr><th>Column</th></tr></thead><tbody><tr><td>Data</td></tr></tbody></table>\n${pad}  <button class="btn" onclick="fetchData('PlaceholderModel')" style="margin-top: 10px;">Load Data</button>\n${pad}</div>`;
      case 'CONTAINER':
      case 'CARD':
      case 'HEADER':
      case 'FOOTER':
      case 'NAV':
      case 'ICON':
      case 'IMAGE':
        const tag = el.type === 'HEADER' ? 'header' :
          el.type === 'FOOTER' ? 'footer' :
            el.type === 'NAV' ? 'nav' : 'div';

        const className = el.type === 'CONTAINER' ? 'container' : el.type.toLowerCase();

        if (el.children && el.children.length > 0) {
          return `${pad}<${tag} class="${className}"${styleAttr}>\n${this.renderElements(el.children, parseInt(pad.length.toString()) + 2)}\n${pad}</${tag}>`;
        }
        return `${pad}<${tag} class="${className}"${styleAttr}></${tag}>`;
      default:
        return `${pad}<!-- ${el.type}: ${el.name} -->`;
    }
  }

  /**
   * Mock 데이터를 생성합니다.
   */
  private generateMockData(ir: DesignIR): Record<string, unknown[]> {
    const data: Record<string, unknown[]> = {};
    for (const model of ir.dataModels) {
      data[model.name] = [
        Object.fromEntries(model.fields.map(f => [f.name, this.sampleValue(f.type)])),
      ];
    }
    return data;
  }

  private sampleValue(type: string): unknown {
    switch (type) {
      case 'STRING': return 'Sample Text';
      case 'TEXT': return 'Lorem ipsum dolor sit amet';
      case 'INTEGER': return 42;
      case 'FLOAT': return 3.14;
      case 'BOOLEAN': return true;
      case 'DATE': return '2026-01-01';
      case 'DATETIME': return '2026-01-01T00:00:00Z';
      case 'EMAIL': return 'user@example.com';
      case 'URL': return 'https://example.com';
      case 'PASSWORD': return '********';
      default: return 'sample';
    }
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  private pluralize(name: string): string {
    if (name.endsWith('s')) return name;
    if (name.endsWith('y')) return name.slice(0, -1) + 'ies';
    return name + 's';
  }
}
