/* eslint-disable import/no-default-export */
/// <reference types='vitest' />
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
// import json from 'vite-plugin-json';
// import staticFiles from 'vite-plugin-static';
// import jsonServer from 'vite-plugin-json-server';

export default defineConfig({
  logLevel: 'info',
  root: __dirname,
  cacheDir: '../../../../node_modules/.vite/packages/streamlit-rxdb-dataframe/frontend',

  server: {
    port: 4201,
    host: 'localhost',
  },

  preview: {
    port: 4301,
    host: 'localhost',
  },

  plugins: [
    // json(),
    react({ tsDecorators: true, devTarget: 'es2022' }),
    nxViteTsPaths(),
  ],

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  base: './', // This is needed to make compiled app work in Streamlit.
  build: {
    outDir: './build',
    emptyOutDir: true,
    reportCompressedSize: true,
    terserOptions: {
      mangle: false,
    },
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        entryFileNames: `[name].js`, // disable hash in file name
        chunkFileNames: `[name].js`, // disable hash in chunk file name
      },
    },
  },
});
