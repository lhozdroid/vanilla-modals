import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        include: ['tests/unit/**/*.test.js'],
        reporters: ['default', 'junit'],
        outputFile: {
            junit: './coverage/junit.xml'
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov', 'json-summary'],
            reportsDirectory: './coverage',
            include: ['src/**/*.js'],
            thresholds: {
                lines: 90,
                functions: 90,
                branches: 90,
                statements: 90
            }
        }
    }
});
