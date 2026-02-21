import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        include: ['packages/*/src/**/*.test.ts', 'cli/src/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['packages/*/src/**/*.ts', 'cli/src/**/*.ts'],
            exclude: ['**/*.test.ts', '**/*.d.ts'],
        },
    },
});
