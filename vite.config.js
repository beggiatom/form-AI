import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiPort = Number(env.API_PORT) || 3001;

  return {
    plugins: [vue()],
    server: {
      host: env.VITE_HOST || "0.0.0.0",
      port: Number(env.VITE_PORT) || 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${apiPort}`,
          changeOrigin: true
        }
      }
    }
  };
});
