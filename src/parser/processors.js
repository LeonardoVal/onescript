const ID_LIKE_VALUES = {
  false: false,
  null: null,
  true: true,
};

/** Processor functions for each parse tree node in the Lezer grammar. They
 * return an object similar to the ESTree representation, or a string if the
 * node really represents a toke rather than an AST node.
 *
 * Please keep the functions sorted by name.
*/
const processors = {
  BinaryExpression(left, op, right) {
    const type = /&&|\|\|/.test(op) ? 'LogicalExpression' : 'BinaryExpression';
    return { type, operator: op, left, right };
  },

  BooleanLiteral(raw) {
    return { type: 'Literal', value: raw === 'true', raw };
  },

  ExpressionStatement(expression) {
    return { type: 'ExpressionStatement', expression };
  },

  IfStatement(_if, test, consequent, alternate = null) {
    return { type: 'IfStatement', test, consequent, alternate };
  },

  Number(raw) {
    return { type: 'Literal', value: +raw, raw };
  },

  ObjectExpression(_ob, properties, _cb) {
    return { type: 'ObjectExpression', properties };
  },

  ParenthesizedExpression(_op, exp, _cp) {
    return exp;
  },

  PostfixExpression(argument, operator) {
    const type = 'UpdateExpression';
    return { type, prefix: false, operator, argument };
  },

  Property(key, _colon, value) {
    return { type: 'Property', key, value };
  },

  PropertyNameDefinition(name) {
    return { type: 'Identifier', name };
  },

  RegExp(raw) {
    // eslint-disable-next-line no-eval
    const value = eval(raw);
    const regex = { pattern: value.source, flags: value.flags };
    return { type: 'Literal', raw, value, regex };
  },

  ReturnStatement(_return, argument) {
    return { type: 'ReturnStatement', argument };
  },

  Script(...body) {
    return { type: 'Program', sourceType: 'script', body };
  },

  String(raw) {
    // eslint-disable-next-line no-eval
    return { type: 'Literal', value: eval(raw), raw };
  },

  UnaryExpression(t1, t2) {
    const prefix = typeof t1 === 'string';
    const operator = prefix ? t1 : t2;
    const argument = prefix ? t2 : t1;
    const type = /--|\+\+/.test(operator) ? 'UpdateExpression' : 'UnaryExpression';
    return { type, prefix, operator, argument };
  },

  VariableDeclaration(kind, ...defs) {
    const declarations = [];
    let op;
    do {
      const decl = defs.shift();
      [, op] = defs.shift();
      if (op === '=') {
        decl.init = defs.shift();
        op = defs.shift();
      } else {
        decl.init = null;
      }
      declarations.push(decl);
    } while (op === ',');
    return { type: 'VariableDeclaration', kind, declarations };
  },

  VariableDefinition(name) {
    return { type: 'VariableDeclarator', id: { type: 'Identifier', name } };
  },

  VariableName(name) {
    if (typeof ID_LIKE_VALUES[name] !== 'undefined') {
      return { type: 'Literal', value: ID_LIKE_VALUES[name] };
    }
    if (name === 'this') {
      return { type: 'ThisExpression' };
    }
    return { type: 'Identifier', name };
  },
}; // processors

'ArithOp BitOp CompareOp Equals LogicOp'
  .trim().split(/\s+/).forEach((noterm) => {
    processors[noterm] = (token) => token;
  });

module.exports = processors;
