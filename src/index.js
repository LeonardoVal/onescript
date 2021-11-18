const { promises: fs } = require('fs');
const { inspect } = require('util');
const { parse } = require('./parser/parser');

function main() {
  const result = parse('yield\t(x);');
  console.log(inspect(result, false, 10));
}
main();
