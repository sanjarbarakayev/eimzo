import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
export default defineConfig({
    plugins: [vue()],
    optimizeDeps: {
        include: ['monaco-editor'],
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    monaco: ['monaco-editor'],
                },
            },
        },
    },
});
