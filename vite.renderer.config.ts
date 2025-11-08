import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: '.vite/renderer/main_window',
  },
});

// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';
// import path from 'path';

// // https://vitejs.dev/config
// export default defineConfig({
//   plugins: [react()],
//   resolve: {
//     alias: {
//       '@': path.resolve(__dirname, './src'),
//       '@renderer': path.resolve(__dirname, './src/renderer'),
//       '@main': path.resolve(__dirname, './src/main'),
//       '@types': path.resolve(__dirname, './src/types'),
//     },
//   },
//   build: {
//     outDir: 'dist/renderer',
//     rollupOptions: {
//       input: {
//         main: path.resolve(__dirname, 'index.html'),
//       },
//     },
//   },
// });