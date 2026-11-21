import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

const base = process.env.PUBLIC_BASE_PATH || '/';

export default defineConfig({
  site: 'https://rasoolbahadran-stack.github.io',
  base,
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
});
