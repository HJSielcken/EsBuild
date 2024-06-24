import {
  Mies
} from "./chunk-5ZHWS2K7.js";
import {
  React,
  ReactDOM,
  init_externals_browser
} from "./chunk-OCDOOBES.js";

// src/Mies.universal.js
init_externals_browser();

// src/Mies.universal.js?universal
init_externals_browser();
function MiesApp({ text }) {
  return /* @__PURE__ */ React.createElement(Mies, { ...{ text } });
}

// src/Mies.universal.js
var { hydrateRoot } = ReactDOM;
var nodes = Array.from(document.querySelectorAll('*[data-kaliber-component-id="fae6900e25efd5d327e5287a3139589c"]'));
nodes.map((x) => {
  const props = JSON.parse(x.dataset.kaliberComponent);
  const newElement = React.createElement(MiesApp, props);
  hydrateRoot(x, newElement);
});
