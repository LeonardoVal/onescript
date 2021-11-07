/* Hand-written tokenizers for JavaScript tokens that can't be
   expressed by lezer's built-in tokenizer. */

const { ExternalTokenizer, ContextTracker } = require('@lezer/lr');
const {
  insertSemi, noSemi, incdec, incdecPrefix, templateContent,
  templateDollarBrace, templateEnd, spaces, newline, BlockComment,
  LineComment, TSExtends, Dialect_ts,
} = require('./lezer-parser.terms');

const space = [
  9, 10, 11, 12, 13, 32, 133, 160, 5760, 8192, 8193, 8194, 8195, 8196, 8197,
  8198, 8199, 8200, 8201, 8202, 8232, 8233, 8239, 8287, 12288,
];

const braceR = 125;
const braceL = 123;
const semicolon = 59;
const slash = 47;
const star = 42;
const plus = 43;
const minus = 45;
const dollar = 36;
const backtick = 96;
const backslash = 92;

const trackNewline = new ContextTracker({
  start: false,
  shift(context, term) {
    return term === LineComment || term === BlockComment
      || (term === spaces ? context : term === newline);
  },
  strict: false,
});

const insertSemicolon = new ExternalTokenizer((input, stack) => {
  const { next } = input;
  if ((next === braceR || next === -1 || stack.context)
    && stack.canShift(insertSemi)
  ) {
    input.acceptToken(insertSemi);
  }
}, { contextual: true, fallback: true });

const noSemicolon = new ExternalTokenizer((input, stack) => {
  const { next } = input;
  let after;
  if (space.indexOf(next) > -1) return;
  // eslint-disable-next-line no-cond-assign
  if (next === slash && ((after = input.peek(1)) === slash || after === star)) {
    return;
  }
  if (next !== braceR && next !== semicolon && next !== -1 && !stack.context
      && stack.canShift(noSemi)) {
    input.acceptToken(noSemi);
  }
}, { contextual: true });

const incdecToken = new ExternalTokenizer((input, stack) => {
  const { next } = input;
  if (next === plus || next === minus) {
    input.advance();
    if (next === input.next) {
      input.advance();
      const mayPostfix = !stack.context && stack.canShift(incdec);
      input.acceptToken(mayPostfix ? incdec : incdecPrefix);
    }
  }
}, { contextual: true });

const template = new ExternalTokenizer((input) => {
  // eslint-disable-next-line no-constant-condition
  for (let afterDollar = false, i = 0; true; i += 1) {
    const { next } = input;
    if (next < 0) {
      if (i) input.acceptToken(templateContent);
      break;
    } else if (next === backtick) {
      if (i) input.acceptToken(templateContent);
      else input.acceptToken(templateEnd, 1);
      break;
    } else if (next === braceL && afterDollar) {
      if (i === 1) input.acceptToken(templateDollarBrace, 1);
      else input.acceptToken(templateContent, -1);
      break;
    } else if (next === 10 /* "\n" */ && i) {
      // Break up template strings on lines, to avoid huge tokens
      input.advance();
      input.acceptToken(templateContent);
      break;
    } else if (next === backslash) {
      input.advance();
    }
    afterDollar = next === dollar;
    input.advance();
  }
});

function tsExtends(value, stack) {
  return value === 'extends'
    && (stack.dialectEnabled(Dialect_ts) ? TSExtends : -1);
}

module.exports = {
  incdecToken,
  insertSemicolon,
  noSemicolon,
  template,
  trackNewline,
  tsExtends,
};
