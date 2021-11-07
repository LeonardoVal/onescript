/* eslint-disable no-unused-vars, object-curly-newline */

/** Processor functions for each parse tree node in the Lezer grammar. They
 * return an object similar to the ESTree representation, or a string if the
 * node really represents a toke rather than an AST node.
 *
 * Please keep the functions sorted by name.
*/
module.exports = {
  BinaryExpression(left, op, right) {
    return { type: 'BinaryExpression', operator: op, left, right };
  },

  BooleanLiteral(raw) {
    return { type: 'Literal', value: raw === 'true', raw };
  },

  CompareOp(op) {
    return op;
  },

  Equals() {
    return '=';
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

  Property(key, _colon, value) {
    return { type: 'Property', key, value };
  },

  PropertyNameDefinition(name) {
    return { type: 'Identifier', name };
  },

  RegExp(raw) {
    // eslint-disable-next-line no-eval
    const reObj = eval(raw);
    const regex = { pattern: reObj.source, flags: reObj.flags };
    return { type: 'Literal', raw, regex };
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
    return { type: 'Identifier', name };
  },
}; // module.exports
