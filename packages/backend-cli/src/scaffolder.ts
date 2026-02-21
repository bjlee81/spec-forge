import type { OpenAPIDocument } from '@figma-codegen/spec-gen';
import type { DatabaseSchema } from '@figma-codegen/spec-gen';
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { SpringInitializr } from './spring-initializr.js';
import { JavaEntityGenerator } from './java/entity-generator.js';
import { JavaRepositoryGenerator } from './java/repository-generator.js';
import { JavaServiceGenerator } from './java/service-generator.js';
import { JavaControllerGenerator } from './java/controller-generator.js';
import { JavaDtoGenerator } from './java/dto-generator.js';
import { JavaConfigGenerator } from './java/config-generator.js';
import { JavaMigrationGenerator } from './java/migration-generator.js';
import { JavaApplicationYmlGenerator } from './java/application-yml-generator.js';

const execAsync = promisify(exec);

export interface BackendConfig {
    /** 프로젝트 이름 */
    projectName: string;
    /** 프로그래밍 언어 */
    language: 'java' | 'python' | 'nodejs';
    /** 프레임워크 */
    framework: 'spring-boot' | 'fastapi' | 'express';
    /** 데이터베이스 */
    database: 'postgresql' | 'mysql' | 'sqlite';
    /** Docker 설정 포함 여부 */
    includeDocker: boolean;
    /** 인증 포함 여부 */
    includeAuth: boolean;
    /** 출력 디렉토리 */
    outputDir: string;

    // Java Specific
    groupId?: string;
    artifactId?: string;
    package?: string;
    javaVersion?: string;
    springBootVersion?: string;
}

export interface ScaffoldResult {
    generatedFiles: string[];
    instructions: string;
}

/**
 * Backend 프로젝트를 스캐폴딩합니다.
 */
export class BackendScaffolder {
    async scaffold(
        config: BackendConfig,
        openapi: OpenAPIDocument,
        dbSchema: DatabaseSchema,
    ): Promise<ScaffoldResult> {
        await mkdir(config.outputDir, { recursive: true });

        switch (config.language) {
            case 'python':
                return this.scaffoldPython(config, openapi, dbSchema);
            case 'java':
                return this.scaffoldJava(config, openapi, dbSchema);
            case 'nodejs':
                return this.scaffoldNodeJS(config, openapi, dbSchema);
            default:
                throw new Error(`Unsupported language: ${config.language}`);
        }
    }

    private async scaffoldPython(
        config: BackendConfig,
        openapi: OpenAPIDocument,
        dbSchema: DatabaseSchema,
    ): Promise<ScaffoldResult> {
        const files: string[] = [];
        const projectDir = config.outputDir;

        // requirements.txt
        const requirements = [
            'fastapi==0.115.0',
            'uvicorn[standard]==0.31.0',
            'sqlalchemy==2.0.35',
            'pydantic==2.9.2',
            'alembic==1.13.3',
        ];
        if (config.database === 'postgresql') requirements.push('psycopg2-binary==2.9.9');
        if (config.database === 'mysql') requirements.push('pymysql==1.1.1');
        if (config.includeAuth) requirements.push('python-jose[cryptography]==3.3.0', 'passlib[bcrypt]==1.7.4');

        await writeFile(join(projectDir, 'requirements.txt'), requirements.join('\n'), 'utf-8');
        files.push('requirements.txt');

        // main.py
        const mainPy = `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="${openapi.info.title}", version="${openapi.info.version}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers
# from routers import ...

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
`;
        await mkdir(join(projectDir, 'app'), { recursive: true });
        await writeFile(join(projectDir, 'app', 'main.py'), mainPy, 'utf-8');
        files.push('app/main.py');

        // models.py
        const modelsPy = this.generatePythonModels(openapi);
        await writeFile(join(projectDir, 'app', 'models.py'), modelsPy, 'utf-8');
        files.push('app/models.py');

        // schemas.py
        const schemasPy = this.generatePythonSchemas(openapi);
        await writeFile(join(projectDir, 'app', 'schemas.py'), schemasPy, 'utf-8');
        files.push('app/schemas.py');

        // schema.sql
        await writeFile(join(projectDir, 'schema.sql'), dbSchema.sql, 'utf-8');
        files.push('schema.sql');

        // Docker 설정
        if (config.includeDocker) {
            const dockerfile = `FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
`;
            await writeFile(join(projectDir, 'Dockerfile'), dockerfile, 'utf-8');
            files.push('Dockerfile');
        }

        return {
            generatedFiles: files,
            instructions: `## Python FastAPI 프로젝트 실행 방법

\`\`\`bash
cd ${config.outputDir}
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
\`\`\`

API 문서: http://localhost:8000/docs`,
        };
    }

    private async scaffoldJava(
        config: BackendConfig,
        openapi: OpenAPIDocument,
        dbSchema: DatabaseSchema,
    ): Promise<ScaffoldResult> {
        const generatedFiles: string[] = [];
        const projectDir = config.outputDir;
        const packageName = config.package || 'com.example.api';
        const basePackagePath = join(projectDir, 'src', 'main', 'java', ...packageName.split('.'));

        // 1. Spring Initializr에서 프로젝트 다운로드 및 해제
        const initializr = new SpringInitializr();
        try {
            console.log('Downloading project from Spring Initializr...');
            const zipBuffer = await initializr.download({
                groupId: config.groupId || 'com.example',
                artifactId: config.artifactId || config.projectName,
                name: config.projectName,
                description: 'Auto-generated by SpecForge',
                packageName: packageName,
                javaVersion: config.javaVersion || '21',
                springBootVersion: config.springBootVersion || '4.0.2',
                dependencies: [], // 기본 의존성은 SpringInitializr 클래스 내부에서 처리됨
                database: config.database,
                includeDocker: config.includeDocker,
                includeAuth: config.includeAuth,
            });

            const zipPath = join(projectDir, 'project.zip');
            await writeFile(zipPath, zipBuffer);

            // Unzip (System command fallback)
            await execAsync(`unzip -o ${zipPath} -d ${projectDir}`);
            await unlink(zipPath); // Remove zip file
            console.log('Project downloaded and extracted.');

            // Add springdoc-openapi dependency
            const buildGradlePath = join(projectDir, 'build.gradle');
            try {
                let buildGradle = await readFile(buildGradlePath, 'utf8');
                if (buildGradle.includes('dependencies {')) {
                    buildGradle = buildGradle.replace(
                        'dependencies {',
                        "dependencies {\n\timplementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.4'"
                    );
                    await writeFile(buildGradlePath, buildGradle);
                    console.log('Added springdoc dependency.');
                }
            } catch (e) {
                console.warn('Could not update build.gradle with springdoc', e);
            }
        } catch (error) {
            console.warn('Failed to download from Spring Initializr, falling back to manual generation.', error);
            throw error;
        }

        // 2. Generators 초기화
        const configGenerator = new JavaConfigGenerator(packageName);

        // 3. 파일 생성 및 쓰기
        const filesToWrite = [
            ...new JavaEntityGenerator(packageName).generate(openapi),
            ...new JavaRepositoryGenerator(packageName).generate(Object.keys(openapi.components.schemas).filter(n => !n.endsWith('CreateRequest'))),
            ...new JavaServiceGenerator(packageName).generate(Object.keys(openapi.components.schemas).filter(n => !n.endsWith('CreateRequest'))),
            ...new JavaControllerGenerator(packageName).generate(Object.keys(openapi.components.schemas).filter(n => !n.endsWith('CreateRequest'))),
            ...new JavaDtoGenerator(packageName).generate(openapi),
            configGenerator.generateSwaggerConfig(openapi.info.title, openapi.info.version),
            configGenerator.generateWebConfig(),
            configGenerator.generateExceptionHandler(),
            configGenerator.generateErrorResponse(),
            configGenerator.generateResourceNotFoundException(),
            new JavaMigrationGenerator().generate(dbSchema),
            ...new JavaApplicationYmlGenerator().generate({
                projectName: config.projectName,
                database: config.database,
                includeAuth: config.includeAuth,
            }),
        ];

        // 4. 리소스 파일 처리 (src/main/resources)
        for (const file of filesToWrite) {
            let fullPath: string;
            if (file.path.endsWith('.yml') || file.path.endsWith('.sql')) {
                // Resources
                if (file.path.startsWith('V1__')) {
                    fullPath = join(projectDir, 'src', 'main', 'resources', 'db', 'migration', file.fileName);
                } else {
                    fullPath = join(projectDir, 'src', 'main', 'resources', file.fileName);
                }
            } else {
                // Java Sources
                fullPath = join(basePackagePath, file.path);
            }

            await mkdir(dirname(fullPath), { recursive: true });
            await writeFile(fullPath, file.content, 'utf-8');
            generatedFiles.push(file.path);
        }

        return {
            generatedFiles,
            instructions: `## Java Spring Boot 프로젝트 실행 방법

\`\`\`bash
cd ${config.outputDir}
# DB 실행 (Docker)
docker-compose up -d

# 앱 실행
./gradlew bootRun
\`\`\`

API 문서: http://localhost:8080/swagger-ui.html`,
        };
    }

    private async scaffoldNodeJS(
        config: BackendConfig,
        openapi: OpenAPIDocument,
        dbSchema: DatabaseSchema,
    ): Promise<ScaffoldResult> {
        const files: string[] = [];
        const projectDir = config.outputDir;

        // package.json
        const pkg = {
            name: config.projectName,
            version: '1.0.0',
            type: 'module',
            scripts: {
                start: 'node src/index.js',
                dev: 'node --watch src/index.js',
            },
            dependencies: {
                express: '^4.21.0',
                cors: '^2.8.5',
                ...(config.database === 'postgresql' ? { pg: '^8.13.0' } : {}),
                ...(config.database === 'mysql' ? { mysql2: '^3.11.0' } : {}),
                ...(config.database === 'sqlite' ? { 'better-sqlite3': '^11.0.0' } : {}),
            },
        };
        await writeFile(join(projectDir, 'package.json'), JSON.stringify(pkg, null, 2), 'utf-8');
        files.push('package.json');

        // src/index.js
        await mkdir(join(projectDir, 'src'), { recursive: true });
        const indexJs = `import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// TODO: Import and register routes

app.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});
`;
        await writeFile(join(projectDir, 'src', 'index.js'), indexJs, 'utf-8');
        files.push('src/index.js');

        // schema.sql
        await writeFile(join(projectDir, 'schema.sql'), dbSchema.sql, 'utf-8');
        files.push('schema.sql');

        return {
            generatedFiles: files,
            instructions: `## Node.js Express 프로젝트 실행 방법

\`\`\`bash
cd ${config.outputDir}
npm install
npm run dev
\`\`\`

서버: http://localhost:3000`,
        };
    }

    private generatePythonModels(openapi: OpenAPIDocument): string {
        let code = `from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

`;

        for (const [name, schema] of Object.entries(openapi.components.schemas)) {
            if (name.endsWith('CreateRequest')) continue;

            code += `class ${name}(Base):\n`;
            code += `    __tablename__ = "${name.toLowerCase()}s"\n\n`;
            code += `    id = Column(Integer, primary_key=True, autoincrement=True)\n`;

            for (const [propName, prop] of Object.entries(schema.properties)) {
                if (propName === 'id') continue;
                const sqlType = this.pythonColumnType(prop.type, prop.format);
                code += `    ${propName} = Column(${sqlType})\n`;
            }

            code += `    created_at = Column(DateTime, default=datetime.utcnow)\n`;
            code += `    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)\n`;
            code += '\n\n';
        }

        return code;
    }

    private generatePythonSchemas(openapi: OpenAPIDocument): string {
        let code = `from pydantic import BaseModel
from typing import Optional
from datetime import datetime

`;

        for (const [name, schema] of Object.entries(openapi.components.schemas)) {
            code += `class ${name}(BaseModel):\n`;
            for (const [propName, prop] of Object.entries(schema.properties)) {
                const pyType = this.pythonType(prop.type, prop.format);
                const isRequired = schema.required.includes(propName);
                code += `    ${propName}: ${isRequired ? pyType : `Optional[${pyType}]`}${isRequired ? '' : ' = None'}\n`;
            }
            code += '\n\n';
        }

        return code;
    }

    private pythonColumnType(type: string, format?: string): string {
        if (format === 'email' || format === 'uri' || format === 'password') return 'String(255)';
        if (format === 'date' || format === 'date-time') return 'DateTime';
        switch (type) {
            case 'integer': return 'Integer';
            case 'number': return 'Float';
            case 'boolean': return 'Boolean';
            default: return 'String(255)';
        }
    }

    private pythonType(type: string, format?: string): string {
        if (format === 'date' || format === 'date-time') return 'datetime';
        switch (type) {
            case 'integer': return 'int';
            case 'number': return 'float';
            case 'boolean': return 'bool';
            default: return 'str';
        }
    }
}
