import { build, context } from 'esbuild';
import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const isWatch = process.argv.includes('--watch');
const outdir = 'dist';

const shared = {
    entryPoints: ['src/index.js'],
    bundle: true,
    sourcemap: true,
    legalComments: 'none'
};

const esmConfig = {
    ...shared,
    format: 'esm',
    outfile: `${outdir}/vanilla-modals.js`
};

const cjsConfig = {
    ...shared,
    format: 'cjs',
    outfile: `${outdir}/vanilla-modals.cjs`
};

const iifeConfig = {
    ...shared,
    format: 'iife',
    globalName: 'VanillaModals',
    minify: true,
    outfile: `${outdir}/vanilla-modals.min.js`
};

/**
 * Runs build or watch mode for all output formats.
 *
 * @returns {Promise<void>}
 */
function runBuild() {
    return mkdir(outdir, { recursive: true }).then(() => {
        if (isWatch) {
            return Promise.all([context(esmConfig), context(cjsConfig), context(iifeConfig)])
                .then(([esmCtx, cjsCtx, iifeCtx]) => Promise.all([esmCtx.watch(), cjsCtx.watch(), iifeCtx.watch()]))
                .then(() => copyAssets())
                .then(() => {
                    console.log('Watching...');
                });
        }

        return Promise.all([build(esmConfig), build(cjsConfig), build(iifeConfig)])
            .then(() => copyAssets())
            .then(() => {
                console.log('Build complete');
            });
    });
}

/**
 * Copies static assets into dist output.
 *
 * @returns {Promise<void>}
 */
function copyAssets() {
    return Promise.all([copyFile(resolve('src/styles.css'), resolve('dist/vanilla-modals.css')), copyFile(resolve('src/types.d.ts'), resolve('dist/vanilla-modals.d.ts'))]).then(() => {});
}

runBuild().catch((error) => {
    console.error(error);
    process.exit(1);
});
