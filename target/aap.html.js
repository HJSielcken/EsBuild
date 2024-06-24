var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/aap.html.js
var aap_html_exports = {};
__export(aap_html_exports, {
  default: () => Index
});
module.exports = __toCommonJS(aap_html_exports);

// externals.js
var React = __toESM(require("react"));
var fs = __toESM(require("fs"));

// src/Mies.js
function Mies({ text }) {
  useTest();
  const [a, setA] = React.useState(0);
  return /* @__PURE__ */ React.createElement("b", null, "WimZus", /* @__PURE__ */ React.createElement("u", null, text), /* @__PURE__ */ React.createElement("button", { onClick: () => setA((a2) => a2 + 1) }, "Klik hier (", a, ")"));
}
function useTest() {
  React.useEffect(
    () => {
      console.log("hallo");
    },
    []
  );
}

// src/Mies.universal.js?universal
function MiesApp({ text }) {
  return /* @__PURE__ */ React.createElement(Mies, { ...{ text } });
}

// src/Mies.universal.js
var import_server = require("react-dom/server");
function ServerComponent(props) {
  const content2 = (0, import_server.renderToString)(/* @__PURE__ */ React.createElement(MiesApp, { ...props }));
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { "data-kaliber-component": JSON.stringify(props), "data-kaliber-component-id": "fae6900e25efd5d327e5287a3139589c", dangerouslySetInnerHTML: { __html: content2 } }), /* @__PURE__ */ React.createElement("script", { src: "Mies.universal-browser.js" }));
}

// /home/harmen/Documents/JavaScript/esbuild/src/aap.html.js:@kaliber/build/stylesheet
var stylesheet = /* @__PURE__ */ React.createElement("link", { rel: "stylesheet", href: getCssBundle("src/aap.html.js") });
function getCssBundle(entrypoint) {
  const metafile = JSON.parse(fs.readFileSync("./metafile.json"));
  const output = Object.values(metafile.outputs).find((x) => x.entryPoint === entrypoint);
  return output.cssBundle.replace("target", ".");
}

// src/aap.css
var content = "aap_content";

// src/aap.html.js
function Index({ title }) {
  return /* @__PURE__ */ React.createElement("html", null, /* @__PURE__ */ React.createElement("head", null, /* @__PURE__ */ React.createElement("title", null, title), stylesheet), /* @__PURE__ */ React.createElement("body", null, /* @__PURE__ */ React.createElement("div", { className: content }, "mies"), /* @__PURE__ */ React.createElement(Mies, { text: "Jet" }), /* @__PURE__ */ React.createElement(ServerComponent, { text: "TeunVuurGijs" })));
}
