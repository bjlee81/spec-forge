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

.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: 0.25rem; font-weight: 500; font-size: 0.9rem; }
.form-group input, .form-group textarea, .form-group select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 0.9rem;
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
}

.btn:hover { background: var(--primary-hover); }

table { width: 100%; border-collapse: collapse; }
th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid var(--border); }
th { background: var(--bg); font-weight: 600; font-size: 0.85rem; text-transform: uppercase; }
`;
    }

    /**
     * 기본 JavaScript를 생성합니다.
     */
    generateJS(ir: DesignIR): string {
        const mockData = this.generateMockData(ir);
        return `// Auto-generated JavaScript
const mockData = ${JSON.stringify(mockData, null, 2)};

console.log('${ir.projectName} Preview loaded');
console.log('Available mock data:', Object.keys(mockData));
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
${elementsHtml}
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
        switch (el.type) {
            case 'TEXT_INPUT':
                return `${pad}<div class="form-group">
${pad}  <label>${el.label || el.name}</label>
${pad}  <input type="text" placeholder="${el.placeholder || ''}" name="${el.dataField || el.name}">
${pad}</div>`;
            case 'TEXT_AREA':
                return `${pad}<div class="form-group">
${pad}  <label>${el.label || el.name}</label>
${pad}  <textarea placeholder="${el.placeholder || ''}" name="${el.dataField || el.name}" rows="4"></textarea>
${pad}</div>`;
            case 'SELECT':
                return `${pad}<div class="form-group">
${pad}  <label>${el.label || el.name}</label>
${pad}  <select name="${el.dataField || el.name}"><option>-- 선택 --</option></select>
${pad}</div>`;
            case 'CHECKBOX':
                return `${pad}<div class="form-group">
${pad}  <label><input type="checkbox" name="${el.dataField || el.name}"> ${el.label || el.name}</label>
${pad}</div>`;
            case 'BUTTON':
                return `${pad}<button class="btn">${el.label || el.name}</button>`;
            case 'LABEL':
                return `${pad}<p>${el.label || el.name}</p>`;
            case 'TABLE':
                return `${pad}<table><thead><tr><th>Column</th></tr></thead><tbody><tr><td>Data</td></tr></tbody></table>`;
            case 'CONTAINER':
                if (el.children && el.children.length > 0) {
                    return `${pad}<div class="container">\n${this.renderElements(el.children, parseInt(pad.length.toString()) + 2)}\n${pad}</div>`;
                }
                return '';
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
}
