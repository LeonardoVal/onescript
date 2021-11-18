const parseFunction = (parts) => {
  const async = parts[0] === 'async';
  if (async) {
    parts.shift();
  }
  parts.shift(); // 'function'
  const generator = parts[0] === '*';
  if (generator) {
    parts.shift();
  }
  const id = !Array.isArray(parts[0]) ? parts.shift() : null;
  const [params, body] = parts;
  return { id, params, body, generator, async };
};

/** Processor functions for each parse tree node in the Lezer grammar. They
 * return an object similar to the ESTree representation, or a string if the
 * node really represents a toke rather than an AST node.
 *
 * Please keep the functions sorted by name.
*/
const processors = {
  ArgList(_op, ...args) {
    return args.filter((arg) => arg !== ',' && arg !== ')');
  },

  ArrayExpression(...parts) {
    const elements = [];
    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i];
      if (part !== ']') {
        if (part === ',' || part === '[') {
          if (parts[i + 1] === ',') {
            elements.push(null); // Empty element.
          }
        } else if (part === '...') {
          i += 1;
          elements.push({ type: 'SpreadElement', argument: parts[i] });
        } else {
          elements.push(part);
        }
      }
    }
    return { type: 'ArrayExpression', elements };
  },

  ArrowFunction(...parts) {
    const async = parts[0] === 'async';
    if (async) {
      parts.shift();
    }
    const [params, _arrow, body] = parts;
    const id = null;
    const expression = body.type !== 'BlockStatement';
    const generator = false;
    return {
      type: 'ArrowFunctionExpression', async, params, body, id, expression, generator,
    };
  },

  AssignmentExpression(left, operator, right) {
    return { type: 'AssignmentExpression', left, operator, right };
  },

  BinaryExpression(left, operator, right) {
    if (left?.name === 'yield' && operator === '*') {
      return { type: 'YieldExpression', argument: right, delegate: true };
    }
    const type = /^(&&|\|\||\?\?)$/.test(operator) ? 'LogicalExpression'
      : 'BinaryExpression';
    return { type, operator, left, right };
  },

  Block(_ob, ...parts) {
    const body = parts.filter((part) => part !== '}');
    return { type: 'BlockStatement', body };
  },

  BooleanLiteral(raw) {
    return { type: 'Literal', value: raw === 'true', raw };
  },

  BreakStatement(_break, _label) {
    const label = _label === ';' ? null : _label;
    return { type: 'BreakStatement', label };
  },

  CallExpression(callee, args) {
    return { type: 'CallExpression', callee, arguments: args };
  },

  ClassBody(_ob, body, _cb) {
    return { type: 'ClassBody', body: _cb ? body : [] };
  },

  ClassDeclaration(_class, id, ...parts) {
    const body = parts.pop();
    const superClass = parts[0] === 'extends' ? parts[1] : null;
    return { type: 'ClassDeclaration', body, id, superClass };
  },

  ClassExpression(_class, ...parts) {
    const body = parts.pop();
    const superClass = parts[0] === 'extends' ? parts[1]
      : (parts[1] === 'extends' ? parts[2] : null);
    const id = parts.length === 1 || parts[1] === 'extends' ? parts[0] : null;
    return { type: 'ClassExpression', body, id, superClass };
  },

  ConditionalExpression(test, _qm, consequent, _colon, alternate) {
    return { type: 'ConditionalExpression', test, consequent, alternate };
  },

  ContinueStatement(_continue, _label) {
    const label = _label === ';' ? null : _label;
    return { type: 'ContinueStatement', label };
  },

  DebuggerStatement() {
    return { type: 'DebuggerStatement' };
  },

  DoStatement(_do, body, _while, test) {
    return { type: 'DoWhileStatement', body, test };
  },

  ExpressionStatement(expression) {
    return { type: 'ExpressionStatement', expression };
  },

  FunctionDeclaration(...parts) {
    return { ...parseFunction(parts), type: 'FunctionDeclaration' };
  },

  FunctionExpression(...parts) {
    return { ...parseFunction(parts), type: 'FunctionExpression' };
  },

  IfStatement(_if, test, consequent, _else, alternate = null) {
    return { type: 'IfStatement', test, consequent, alternate };
  },

  MemberExpression(object, op, property) {
    const computed = op === '[';
    return { type: 'MemberExpression', object, property, computed };
  },

  NullLiteral() {
    return { type: 'Literal', value: null };
  },

  NewExpression(_new, callee, args) {
    return { type: 'NewExpression', callee, arguments: args };
  },

  Number(raw) {
    const value = /n$/.test(raw) ? BigInt(raw.replace(/n$/, '')) : +raw;
    return { type: 'Literal', value, raw };
  },

  ObjectExpression(_ob, ...properties) {
    properties = properties.filter((prop) => prop !== ',' && prop !== '}');
    return { type: 'ObjectExpression', properties };
  },

  ParamList(_op, ...parts) {
    return parts.filter((part) => part !== ',' && part !== ')');
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

  SequenceExpression(...exps) {
    const expressions = exps.filter((part) => part !== ',');
    return { type: 'SequenceExpression', expressions };
  },

  String(raw) {
    // eslint-disable-next-line no-eval
    return { type: 'Literal', value: eval(raw), raw };
  },

  ThrowStatement(_throw, argument) {
    return { type: 'ThrowStatement', argument };
  },

  TryStatement(_try, block, ...parts) {
    let handler = null;
    if (parts[0] === 'catch') {
      parts.shift();
      let param = null;
      if (parts[0] === '(') {
        [, param] = parts.splice(0, 3);
      }
      handler = { type: 'CatchClause', param, body: parts.shift() };
    }
    let finalizer = null;
    if (parts[0] === 'finally') {
      [, finalizer] = parts.splice(0, 2);
    }
    return { type: 'TryStatement', block, handler, finalizer };
  },

  UnaryExpression(t1, t2) {
    const prefix = typeof t1 === 'string';
    const operator = prefix ? t1 : t2;
    const argument = prefix ? t2 : t1;
    if (operator === 'await') {
      return { type: 'AwaitExpression', argument };
    }
    if (operator === 'yield') {
      const delegate = false;
      return { type: 'YieldExpression', argument, delegate };
    }
    const type = /^(--|\+\+)$/.test(operator) ? 'UpdateExpression'
      : 'UnaryExpression';
    return { type, prefix, operator, argument };
  },

  VariableDeclaration(kind, ...defs) {
    const declarations = [];
    let op;
    do {
      const decl = { type: 'VariableDeclarator', id: defs.shift() };
      op = defs.shift();
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
    return { type: 'Identifier', name };
  },

  VariableName(name) {
    if (name === 'this') {
      return { type: 'ThisExpression' };
    }
    return { type: 'Identifier', name };
  },

  WhileStatement(_while, test, body) {
    return { type: 'WhileStatement', test, body };
  },

  WithStatement(_with, object, body) {
    return { type: 'WithStatement', object, body };
  },
}; // processors

'ArithOp Arrow BitOp CompareOp Equals LogicOp Spread Star UpdateOp'
  .trim().split(/\s+/).forEach((noterm) => {
    processors[noterm] = (token) => token;
  });

module.exports = processors;
