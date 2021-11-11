/* globals describe, it, expect */
const { inspect } = require('util');
const { parse: acornParse } = require('acorn');
const cloneRoot = require('espurify');
const { parse } = require('../../src/parser/parser');

// TODO obj?.prop obj?.['prop'] x??=3 x\tin\t0 typeof\tx
const EXPS = `
  0 1 3.45 0.8e12 1.22e-7 0xC4f3 100n
  "" "x" "a\\t\\"." '' 'x' '<\\x12\\u1234>'
  /[0-9]+/ /\\d+/gi
  true false null NaN Infinity this
  +1 -2.3 !false !!true ~1 ++pre --pre post++ post--
  1+2 1-2 1*2 1/2 1%2 1**2 1<<2 1>>2 1>>>2
  1==2 1!=2 1===2 1!==2 1<2 1<=2 1>2 1>=2
  1&2 1|2 1&&2 1||2 1^2 1??2
  1?2:3
  [] [0] [3,] [0,1,2]
  {} {x:1} {a:7,} {'x':1,['y']:2}
  obj.prop obj.x.y obj['prop'] obj[0][1] obj[0].x obj.x[0]
  x=1 x+=1 x-=1 x*=1 x/=1 x**=1 x<<=2 x>>=2 x>>>=2 x&=3 x|=3 x^=3
`.trim().split(/[ \n\r]+/);

describe('Lezer parser', () => {
  it('parses expresions properly', () => {
    // Expression tests cases, as expression statements.
    EXPS.map((exp) => `(${exp});`).forEach((test) => {
      const expected = cloneRoot(acornParse(`${test}`, { ecmaVersion: 2020 }));
      let received;
      try {
        received = cloneRoot(parse(`${test}`));
      } catch (error) {
        throw new Error(`Lezer failed!\n${test}\n\n${inspect(expected, false, 10)}\n\n${error}`);
      }
      expect(received).toEqual(expected);
    });
  });
});
