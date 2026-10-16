import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: fileURLToPath(new URL('./index.html', import.meta.url)),
        jvc: fileURLToPath(new URL('./jvc/index.html', import.meta.url)),
      },
    },
  },
});
