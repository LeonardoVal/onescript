const { promises: fs } = require('fs');
const { inspect } = require('util');
const { parse } = require('./parser/parser');

function main() {
  const result = parse('typeof 1;');
  console.log(inspect(result, false, 10));
}
main();
