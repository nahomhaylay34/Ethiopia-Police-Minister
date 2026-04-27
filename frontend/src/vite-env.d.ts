/// <reference types="vite/client" />

declare module '@tailwindcss/vite' {
  const plugin: () => import('vite').Plugin;
  export default plugin;
}
