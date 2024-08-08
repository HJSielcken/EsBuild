# TODOS
- [x] Universal plugin
- [x] Css modules on server and client
- [ ] Custom media queries in css
- [x] Watch/rebuild
- [x] Hot reloading and/or live reloading of css and JavaScript (Is now a very simple location.reload)
- [ ] Proper error messages and handling
- [ ] Progressbar
- [ ] Refactoring/rewriting
- [ ] Optimizing/caching

To use globally-scoped css classes, I use the import attribute `with { type: 'bglobal-css'}`.
For instance 

```js
import 'keen-slider/keen-slider.min.css' with { type: 'global-css'}
```
To get rid of the errors, we should add the following plugin to the .eslintrc
- '@babel/plugin-syntax-import-attributes'
- Update tsconfig `compilerOptions.moduleResolution` to `nodenext`
