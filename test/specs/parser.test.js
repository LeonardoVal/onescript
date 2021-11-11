/* globals describe, it, expect */
const { inspect } = require('util');
const { parse: acornParse } = require('acorn');
const cloneRoot = require('espurify');
const { parse } = require('../../src/parser/parser');

// TODO null this obj?.prop obj?.['prop']
const EXPS = `
  0 1 3.45 0.8e12 1.22e-7 0xC4f3 100n
  "" "x" "a\\t\\"." '' 'x' '<\\x12\\u1234>'
  /[0-9]+/ /\\d+/gi
  true false NaN Infinity
  +1 -2.3 !false !!true ~1 ++pre --pre post++ post--
  1+2 1-2 1*2 1/2 1%2 1**2 1<<2 1>>2 1>>>2
  1==2 1!=2 1===2 1!==2 1<2 1<=2 1>2 1>=2
  1&2 1|2 1&&2 1||2 1^2 1??2
  1?2:3 1,2
  typeof\tx void\t0
  x\tin\t0  
  [] [0] [3,] [0,1,2]
  {} {x:1} {null:7,} {'x':1,['y']:2}
  obj.prop obj.x.y obj['prop'] obj[0][1] obj[0].x obj.x[0]
  x=1 x+=1 x-=1 x*=1 x/=1 x**=1 x<<=2 x>>=2 x>>>=2 x&=3 x|=3 x^=3 x&&=4 x||=4 x??=4
  f() f(1) f(1,2) obj.meth() obj.meth(1,2)
`.trim().split(/[ \n\r]+/);

// TODO if(1)x=2;
const STMTS = `
  return(1);
  if(1)x=1;
  if(1)x=0;else{x=1;}
  while(0){}
  var\tx; var\tx=1; let\tx; let\tx=1; const\tx=1;
`.trim().split(/[ \n\r]+/);

describe('Lezer parser', () => {
  it('parses expresions properly', () => {
    // Expression tests cases, as expression statements.
    EXPS.map((exp) => `(${exp});`).forEach((test) => {
      const expected = cloneRoot(acornParse(`${test}`, { ecmaVersion: 2021 }));
      let received;
      try {
        received = cloneRoot(parse(`${test}`));
      } catch (error) {
        throw new Error(`Lezer failed!\n${test}\n\n${inspect(expected, false, 10)}\n\n${error}`);
      }
      expect(received).toEqual(expected);
    });
  });

  it('parses statements properly', () => {
    STMTS.map((stmt) => `function _() {${stmt}}`).forEach((test) => {
      const expected = cloneRoot(acornParse(`${test}`, { ecmaVersion: 2021 }));
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
