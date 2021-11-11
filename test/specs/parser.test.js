/* globals describe, it, expect */
const { parse: acornParse } = require('acorn');
const cloneRoot = require('espurify');
const { parse } = require('../../src/parser/parser');

const EXPS = `
  0 1 3.45 0.8e12 1.22e-7 0xC4f3
  "" "x" "a\\t\\"." '' 'x' '<\\x12\\u1234>'
  /[0-9]+/ /\\d+/gi
  true false null NaN Infinity this
  +1 -2.3 !false !!true ~1 ++pre --pre post++ post--
  1+2 1-2 1*2 1/2 1**2
  1==2 1!=2 1===2 1!==2 1<2 1<=2 1>2 1>=2
  1&2 1|2 1&&2 1||2 1^2
`.trim().split(/\s+/);

describe('Lezer parser', () => {
  it('parses expresions properly', () => {
    // Expression tests cases, as expression statements.
    EXPS.map((exp) => `(${exp});`).forEach((test) => {
      const expected = cloneRoot(acornParse(`${test}`, { ecmaVersion: 2020 }));
      let received;
      try {
        received = cloneRoot(parse(`${test}`));
      } catch (error) {
        throw new Error(`Lezer failed!\n${test}\n\n${JSON.stringify(expected)}\n\n${error}`);
      }
      expect(received).toEqual(expected);
    });
  });
});
