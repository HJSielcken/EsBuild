# TODOS
- [x] Universal plugin
- [x] Css modules on server and client
- [x] Watch/rebuild
- [x] Simple reload on complete
- [x] Copy unused files plugin
- [ ] Custom media queries in css
- [ ] Hot reloading and/or live reloading of css and JavaScript
- [ ] Fingerprinting css
- [ ] Sourcemaps
- [ ] Css in Sanity Studio (Does not work, and has probably to do with dynamic imports)
- [ ] Proper error messages and handling
- [ ] Refactoring/rewriting
- [ ] Optimizing/caching
- [ ] Progressbar

To use globally-scoped css classes, use the import attribute `with { type: 'global-css'}`.
For instance 

```js
import 'keen-slider/keen-slider.min.css' with { type: 'global-css'}
```
To get rid of the errors, we should add the following plugin to the .eslintrc
- '@babel/plugin-syntax-import-attributes'
- Update tsconfig `compilerOptions.moduleResolution` to `Bundler` and `compilerOptions.module` to `Preserve` (do not knwo if these are the best options)
