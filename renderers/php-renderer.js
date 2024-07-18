const { renderToStaticMarkup } = require(`${process.cwd()}/node_modules/react-dom/server`)
const React = require(`${process.cwd()}/node_modules/react`)

const PHP_PROPS = '%PHP_PROPS%'

module.exports = function phpReactRenderer(template) {
  if (!template) return template
  const templateWithPhpProps = React.cloneElement(template, { phpProps: PHP_PROPS })
  return `
    <?php
      // nowdoc syntax requires the closing 'tag' is at the very beginning of it's own line.
      $template = <<<'KALIBERJS_REACT_TEMPLATE'
        ${renderToStaticMarkup(templateWithPhpProps)}
KALIBERJS_REACT_TEMPLATE;
      $props = htmlspecialchars(json_encode([]), ENT_QUOTES, 'UTF-8');
      echo str_replace("&quot;${PHP_PROPS}&quot;", $props, $template);
    ?>
  `
}
