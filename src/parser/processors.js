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
  ArrayExpression(_ob, ...elements) {
    elements = elements.filter((elem) => elem !== ',' && elem !== ']');
    return { type: 'ArrayExpression', elements };
  },

  AssignmentExpression(left, operator, right) {
    return { type: 'AssignmentExpression', left, operator, right };
  },

  BinaryExpression(left, op, right) {
    const type = /&&|\|\||\?\?/.test(op) ? 'LogicalExpression' : 'BinaryExpression';
    return { type, operator: op, left, right };
  },

  BooleanLiteral(raw) {
    return { type: 'Literal', value: raw === 'true', raw };
  },

  ConditionalExpression(test, _qm, consequent, _colon, alternate) {
    return { type: 'ConditionalExpression', test, consequent, alternate };
  },

  ExpressionStatement(expression) {
    return { type: 'ExpressionStatement', expression };
  },

  IfStatement(_if, test, consequent, alternate = null) {
    return { type: 'IfStatement', test, consequent, alternate };
  },

  MemberExpression(object, op, property) {
    const computed = op === '[';
    return { type: 'MemberExpression', object, property, computed };
  },

  Number(raw) {
    const value = /n$/.test(raw) ? BigInt(raw.replace(/n$/, '')) : +raw;
    return { type: 'Literal', value, raw };
  },

  ObjectExpression(_ob, ...properties) {
    properties = properties.filter((prop) => prop !== ',' && prop !== '}');
    return { type: 'ObjectExpression', properties };
  },

  ParenthesizedExpression(_op, exp, _cp) {
    return exp;
  },

  PostfixExpression(argument, operator) {
    const type = 'UpdateExpression';
    return { type, prefix: false, operator, argument };
  },

  Property(...args) {
    let computed = false;
    const kind = 'init';
    const method = false;
    const shorthand = false;
    if (args[0] === '[') {
      const [_ob, key, _cb, _colon, value] = args;
      computed = true;
      return { type: 'Property', key, value, computed, kind, method, shorthand };
    }
    const [key, _colon, value] = args;
    return { type: 'Property', key, value, computed, kind, method, shorthand };
  },

  PropertyName(name) {
    return { type: 'Identifier', name };
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

'ArithOp BitOp CompareOp Equals LogicOp UpdateOp'
  .trim().split(/\s+/).forEach((noterm) => {
    processors[noterm] = (token) => token;
  });

module.exports = processors;
