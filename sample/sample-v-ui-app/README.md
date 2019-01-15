## Aurelia bare application

  * Static assets in static folder, will be copied over to dist folder, on the same level with `index.html`. See `index.html` for example how to reference static resources.

  * This is supposed to be used in traditional way: run the build script and then double click on `dist/index.html`, then make changes, and reload the browser.

  * If a web server is needed for greater capability (lazy loading, auto reload), `webpack-dev-server` is needed. Install it via `npm install webpack-dev-server --save-dev` and then do `npm run dev`.
  
### Dev

  * Install dependencies:
  ```
  npm install
  ```

  * Run build task:
  ```
  npm run build
  ```

  * Run build, with auto rebuild:
  ```
  npm run build:watch
  ```

  * Run development server with `webpack-dev-server`:
  ```
  npm install webpack-dev-server --save-dev
  npm run dev
  ```

### Build the code

  * After installing dependencies, run `build` or `build:prod`:

  ```
  npm run build
  ```

  or

  ```
  npm run build:prod
  ```
    