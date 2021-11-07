const { inspect } = require('util');
const { parser: lezerParser } = require('./lezer-parser');
const processors = require('./processors');

function buildESTree(cursor, input) {
  const { name, from, to } = cursor;
  const args = [];
  if (cursor.firstChild()) {
    do {
      const arg = buildESTree(cursor, input);
      args.push(arg);
    } while (cursor.nextSibling());
    cursor.parent();
  } else {
    args.push(input.substring(from, to));
  }
  const processor = processors[name];
  if (processor) { // AST node
    return processor(...args);
  }
  if (args.length === 1 && name === args[0]) { // Token
    return name;
  }
  throw new SyntaxError(`Cannot process ${name}! Args: ${inspect(args)}`);
}

function parse(source) {
  const tree = lezerParser.parse(source);
  const cursor = tree.cursor();
  const esTree = buildESTree(cursor, source);
  return esTree;
}

module.exports = {
  parse,
};
