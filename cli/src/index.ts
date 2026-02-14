#!/usr/bin/env node
import { Command } from 'commander';
import { select, input, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import ora from 'ora';
import { FigmaReader } from '@figma-codegen/figma-reader';
import { DesignParser } from '@figma-codegen/design-parser';
import { FrontendGenerator } from '@figma-codegen/frontend-gen';
import { OpenAPIGenerator, SchemaGenerator, TechSpecGenerator } from '@figma-codegen/spec-gen';
import { BackendScaffolder } from '@figma-codegen/backend-cli';
import type { BackendConfig } from '@figma-codegen/backend-cli';
import type { DesignIR } from '@figma-codegen/design-parser';
import type { OpenAPIDocument, DatabaseSchema } from '@figma-codegen/spec-gen';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const program = new Command();

program
    .name('figma-codegen')
    .description('Figma 디자인에서 Backend API 서버까지 — PM처럼 단계별 안내')
    .version('0.1.0');

/**
 * 전체 파이프라인 실행 (PM 모드)
 */
program
    .command('run')
    .description('🚀 전체 파이프라인 실행 (단계별 검토 포함)')
    .action(async () => {
        console.log(chalk.bold.blue('\n🎯 SpecForge — PM Mode\n'));
        console.log(chalk.gray('각 단계의 결과를 확인하고 다음 단계로 진행합니다.\n'));

        // Step 1: Figma 파일 읽기
        console.log(chalk.bold.yellow('━━━ Step 1/5: Figma 디자인 읽기 ━━━\n'));

        const figmaToken = await input({
            message: 'Figma Personal Access Token:',
        });

        const fileKey = await input({
            message: 'Figma File Key (URL에서 추출):',
        });

        const spinner = ora('Figma 파일 읽는 중...').start();
        let ir: DesignIR;

        try {
            const reader = new FigmaReader({ accessToken: figmaToken });
            const figmaFile = await reader.readFile(fileKey);
            spinner.succeed(`Figma 파일 읽기 완료: ${figmaFile.name}`);

            // Step 2: Design 파싱
            console.log(chalk.bold.yellow('\n━━━ Step 2/5: 디자인 분석 ━━━\n'));
            const parser = new DesignParser();
            ir = parser.parse(figmaFile);

            console.log(chalk.green(`  ✅ 화면 ${ir.screens.length}개 발견`));
            console.log(chalk.green(`  ✅ 데이터 모델 ${ir.dataModels.length}개 추론`));
            ir.screens.forEach(s => console.log(chalk.gray(`     - ${s.name} (${s.screenType})`)));

        } catch (error) {
            spinner.fail('Figma 파일 읽기 실패');
            console.error(chalk.red(`오류: ${error}`));
            process.exit(1);
        }

        const proceed1 = await confirm({ message: '다음 단계(Frontend Preview)로 진행할까요?' });
        if (!proceed1) { console.log(chalk.yellow('중단되었습니다.')); return; }

        // Step 3: Frontend Preview 생성
        console.log(chalk.bold.yellow('\n━━━ Step 3/5: Frontend Preview 생성 ━━━\n'));
        const outputBase = await input({ message: '출력 디렉토리:', default: './output' });
        const frontendDir = join(outputBase, 'frontend');

        const frontendSpinner = ora('Frontend 파일 생성 중...').start();
        const frontendGen = new FrontendGenerator({ outputDir: frontendDir });
        const frontendFiles = await frontendGen.generate(ir);
        frontendSpinner.succeed(`Frontend 파일 ${frontendFiles.length}개 생성`);
        frontendFiles.forEach(f => console.log(chalk.gray(`     - ${f}`)));

        const proceed2 = await confirm({ message: '다음 단계(Spec 생성)로 진행할까요?' });
        if (!proceed2) { console.log(chalk.yellow('중단되었습니다.')); return; }

        // Step 4: Spec 생성
        console.log(chalk.bold.yellow('\n━━━ Step 4/5: Spec 문서 생성 ━━━\n'));
        const specSpinner = ora('OpenAPI Spec, DB Schema, Tech Spec 생성 중...').start();

        const openapiGen = new OpenAPIGenerator();
        const openapi: OpenAPIDocument = openapiGen.generate(ir);

        const schemaGen = new SchemaGenerator();
        const dbSchema: DatabaseSchema = schemaGen.generate(ir);

        const techSpecGen = new TechSpecGenerator();
        const techSpec = techSpecGen.generate(ir, openapi, dbSchema);

        const specDir = join(outputBase, 'specs');
        await mkdir(specDir, { recursive: true });

        await writeFile(join(specDir, 'openapi.json'), JSON.stringify(openapi, null, 2), 'utf-8');
        await writeFile(join(specDir, 'schema.sql'), dbSchema.sql, 'utf-8');
        await writeFile(join(specDir, 'tech-spec.md'), techSpec, 'utf-8');

        specSpinner.succeed('Spec 문서 생성 완료');
        console.log(chalk.gray(`     - ${join(specDir, 'openapi.json')}`));
        console.log(chalk.gray(`     - ${join(specDir, 'schema.sql')}`));
        console.log(chalk.gray(`     - ${join(specDir, 'tech-spec.md')}`));

        const proceed3 = await confirm({ message: '다음 단계(Backend 생성)로 진행할까요?' });
        if (!proceed3) { console.log(chalk.yellow('중단되었습니다.')); return; }

        // Step 5: Backend 스캐폴딩
        console.log(chalk.bold.yellow('\n━━━ Step 5/5: Backend 프로젝트 생성 ━━━\n'));

        const language = await select({
            message: '프로그래밍 언어:',
            choices: [
                { value: 'python', name: '🐍 Python' },
                { value: 'java', name: '☕ Java' },
                { value: 'nodejs', name: '🟢 Node.js' },
            ],
        }) as BackendConfig['language'];

        const frameworkChoices: Record<string, { value: string; name: string }[]> = {
            python: [{ value: 'fastapi', name: 'FastAPI' }],
            java: [{ value: 'spring-boot', name: 'Spring Boot' }],
            nodejs: [{ value: 'express', name: 'Express' }],
        };

        const framework = await select({
            message: '프레임워크:',
            choices: frameworkChoices[language],
        }) as BackendConfig['framework'];

        const database = await select({
            message: '데이터베이스:',
            choices: [
                { value: 'postgresql', name: '🐘 PostgreSQL' },
                { value: 'mysql', name: '🐬 MySQL' },
                { value: 'sqlite', name: '📦 SQLite' },
            ],
        }) as BackendConfig['database'];

        const includeDocker = await confirm({ message: 'Docker 설정 포함?', default: true });
        const includeAuth = await confirm({ message: '인증(Auth) 포함?', default: true });

        const backendDir = join(outputBase, 'backend');
        const scaffoldSpinner = ora('Backend 프로젝트 생성 중...').start();

        const scaffolder = new BackendScaffolder();
        const result = await scaffolder.scaffold(
            {
                projectName: ir.projectName,
                language,
                framework,
                database,
                includeDocker,
                includeAuth,
                outputDir: backendDir,
            },
            openapi,
            dbSchema,
        );

        scaffoldSpinner.succeed(`Backend 파일 ${result.generatedFiles.length}개 생성`);
        result.generatedFiles.forEach(f => console.log(chalk.gray(`     - ${f}`)));

        // 완료
        console.log(chalk.bold.green('\n🎉 모든 단계가 완료되었습니다!\n'));
        console.log(chalk.cyan('📁 생성된 결과물:'));
        console.log(chalk.gray(`   Frontend: ${frontendDir}`));
        console.log(chalk.gray(`   Specs:    ${specDir}`));
        console.log(chalk.gray(`   Backend:  ${backendDir}`));
        console.log('\n' + result.instructions);
    });

/**
 * 개별 명령어: Figma 읽기
 */
program
    .command('read')
    .description('📐 Figma 파일 읽기')
    .requiredOption('-k, --file-key <key>', 'Figma 파일 키')
    .requiredOption('-t, --token <token>', 'Figma 토큰')
    .option('-o, --output <path>', '출력 파일', './figma-data.json')
    .action(async (opts) => {
        const spinner = ora('Figma 파일 읽는 중...').start();
        try {
            const reader = new FigmaReader({ accessToken: opts.token });
            const file = await reader.readFile(opts.fileKey);
            await writeFile(opts.output, JSON.stringify(file, null, 2), 'utf-8');
            spinner.succeed(`저장 완료: ${opts.output}`);
        } catch (e) {
            spinner.fail(`실패: ${e}`);
        }
    });

program.parse();
