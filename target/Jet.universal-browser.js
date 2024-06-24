import {
  Mies
} from "./chunk-5ZHWS2K7.js";
import {
  React,
  ReactDOM,
  init_externals_browser
} from "./chunk-OCDOOBES.js";

// src/Jet.universal.js
init_externals_browser();

// src/Jet.universal.js?universal
init_externals_browser();
function JetApp({ text }) {
  return /* @__PURE__ */ React.createElement(Mies, { ...{ text } });
}

// src/Jet.universal.js
var { hydrateRoot } = ReactDOM;
var nodes = Array.from(document.querySelectorAll('*[data-kaliber-component-id="ea7d5cf23fc8a56b6c17a9b5dc570986"]'));
nodes.map((x) => {
  const props = JSON.parse(x.dataset.kaliberComponent);
  const newElement = React.createElement(JetApp, props);
  hydrateRoot(x, newElement);
});
