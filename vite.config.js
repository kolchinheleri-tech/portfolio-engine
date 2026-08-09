import {
  defineConfig
} from "vite";

import {
  resolve
} from "path";


export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        exhibition:
          resolve(
            __dirname,
            "index.html"
          ),

        product:
          resolve(
            __dirname,
            "product.html"
          )
      }
    }
  }
});