import {
  React,
  init_externals_browser
} from "./chunk-OCDOOBES.js";

// src/Mies.js
init_externals_browser();
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

export {
  Mies
};
