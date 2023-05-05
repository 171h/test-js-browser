// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ["nuxt-electron"],
  electron: {
    // include: ["electron"],
    outDir: "dist-electron",
  },
});
