/* globals describe, it, expect */
const { parse: acornParse } = require('acorn');
const cloneRoot = require('espurify');
const { parse } = require('../../src/parser/parser');

describe('Lezer parser', () => {
  it('parses expresions properly', () => {
    [ // Expression tests cases, as expression statements.
      '1;',
    ].forEach((test) => {
      const received = cloneRoot(parse(`${test}`));
      const expected = cloneRoot(acornParse(`${test}`, { ecmaVersion: 2020 }));
      expect(received).toEqual(expected);
    });
  });
});
