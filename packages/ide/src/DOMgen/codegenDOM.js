/** @jsx createElement */
/** @jsxFrag Fragment */
import createElement, { cloneElement } from './createElement'
import Fragment from './Fragment'
import {
  makeStatement,
  makeBlock,
  withBoundary,
  withSeparator, makeDeclaration
} from './components'

function addSeparatorToChildren(vnode, separator = ',') {
  // return cloneElement(vnode, {}, ...withSeparator(vnode.children, <separator>{separator}</separator>))
  return cloneElement(vnode, {},
    cloneElement(
      vnode.children[0],
      {},
      ...withSeparator(vnode.children[0].children, separator)
    )
  )
}

const { stringify } = JSON

const OPERATOR_PRECEDENCE = {
  '||': 3,
  '&&': 4,
  '|': 5,
  '^': 6,
  '&': 7,
  '==': 8,
  '!=': 8,
  '===': 8,
  '!==': 8,
  '<': 9,
  '>': 9,
  '<=': 9,
  '>=': 9,
  in: 9,
  instanceof: 9,
  '<<': 10,
  '>>': 10,
  '>>>': 10,
  '+': 11,
  '-': 11,
  '*': 12,
  '%': 12,
  '/': 12,
  '**': 13,
}

// Enables parenthesis regardless of precedence
const NEEDS_PARENTHESES = 17

const EXPRESSIONS_PRECEDENCE = {
  // Definitions
  ArrayExpression: 20,
  TaggedTemplateExpression: 20,
  ThisExpression: 20,
  Identifier: 20,
  Literal: 18,
  TemplateLiteral: 20,
  Super: 20,
  SequenceExpression: 20,
  // Operations
  MemberExpression: 19,
  CallExpression: 19,
  NewExpression: 19,
  // Other definitions
  ArrowFunctionExpression: NEEDS_PARENTHESES,
  ClassExpression: NEEDS_PARENTHESES,
  FunctionExpression: NEEDS_PARENTHESES,
  ObjectExpression: NEEDS_PARENTHESES,
  // Other operations
  UpdateExpression: 16,
  UnaryExpression: 15,
  BinaryExpression: 14,
  LogicalExpression: 13,
  ConditionalExpression: 4,
  AssignmentExpression: 3,
  AwaitExpression: 2,
  YieldExpression: 2,
  RestElement: 1,
}

function expressionNeedsParenthesis(node, parentNode, isRightHand) {
  const nodePrecedence = EXPRESSIONS_PRECEDENCE[node.type]
  if (nodePrecedence === NEEDS_PARENTHESES) {
    return true
  }
  const parentNodePrecedence = EXPRESSIONS_PRECEDENCE[parentNode.type]
  if (nodePrecedence !== parentNodePrecedence) {
    // Different node types
    return (
      (!isRightHand &&
        nodePrecedence === 15 &&
        parentNodePrecedence === 14 &&
        parentNode.operator === '**') ||
      nodePrecedence < parentNodePrecedence
    )
  }
  if (nodePrecedence !== 13 && nodePrecedence !== 14) {
    // Not a `LogicalExpression` or `BinaryExpression`
    return false
  }
  if (node.operator === '**' && parentNode.operator === '**') {
    // Exponentiation operator has right-to-left associativity
    return !isRightHand
  }
  if (isRightHand) {
    // Parenthesis are used if both operators have the same precedence
    return (
      OPERATOR_PRECEDENCE[node.operator] <=
      OPERATOR_PRECEDENCE[parentNode.operator]
    )
  }
  return (
    OPERATOR_PRECEDENCE[node.operator] <
    OPERATOR_PRECEDENCE[parentNode.operator]
  )
}


function hasCallExpression(node) {
  /*
  Returns `true` if the provided `node` contains a call expression and `false` otherwise.
  */
  let currentNode = node
  while (currentNode != null) {
    const { type } = currentNode
    if (type[0] === 'C' && type[1] === 'a') {
      // Is CallExpression
      return true
    } else if (type[0] === 'M' && type[1] === 'e' && type[2] === 'm') {
      // Is MemberExpression
      currentNode = currentNode.object
    } else {
      return false
    }
  }
}


/****************************************************************
 *
 * baseGenerator
 *
 * TODO 去掉所有 identifier
 *
 ****************************************************************/
const ParenthesisBoundary = ['(', ')']
const BracketBoundary = ['{', '}']
const SquareBracketBoundary = ['[', ']']

// 为了复用
let ForInStatement,
  FunctionDeclaration,
  RestElement,
  BinaryExpression,
  ArrayExpression,
  BlockStatement

export const baseGenerator = {
  Program(node, state) {
    return (
      <program>
        {this.render('body')}
      </program>
    )
  },
  BlockStatement: (BlockStatement = function (node, state) {
    return makeStatement({
      boundaries: BracketBoundary,
      children: this.render('body')
    })
  }),
  ClassBody: BlockStatement,
  EmptyStatement(node, state) {
    return <statement></statement>
  },
  ExpressionStatement(node, state) {
    const precedence = EXPRESSIONS_PRECEDENCE[node.expression.type]
    const boundaries = (
      precedence === NEEDS_PARENTHESES ||
      (precedence === 3 && node.expression.left.type[0] === 'O')
    ) ? ParenthesisBoundary : null

    return makeStatement({
      boundaries,
      children: this.render('expression')
    })
  },
  IfStatement(node, state) {
    return (
      <statement>
        {makeBlock({
          keyword: 'if',
          boundaries: ParenthesisBoundary,
          children: this.render('test'),
          next: this.render('consequent'),
        })}
        {node.alternate ?
          (<>
            <keyword>else</keyword>
            {this.render('alternate')}
          </>) :
          null
        }
      </statement>
    )
  },
  LabeledStatement(node, state) {
    return (
      <statement>
        {this.render('label')}
        <separator>:</separator>
        {this.render('body')}
      </statement>
    )
  },
  BreakStatement(node, state) {
    return (
      <statement>
        <keyword>break</keyword>
        {this.render('label')}
      </statement>
    )
  },
  ContinueStatement(node, state) {
    return (
      <statement>
        <keyword>continue</keyword>
        {this.render('label')}
      </statement>
    )
  },
  WithStatement(node, state) {
    return makeStatement({
      keyword: 'with',
      boundaries: ParenthesisBoundary,
      children: this.render('object'),
      next: this.render('body'),
    })
  },
  SwitchStatement(node, state) {
    return makeStatement({
      keyword: 'switch',
      boundaries: ParenthesisBoundary,
      children: this.render('discriminant'),
      next: withBoundary(BracketBoundary, this.render('cases')),
    })
  },
  SwitchCase(node) {
    return (
      <node>
        <keyword>case</keyword>
        {this.render('test')}
        <separator>:</separator>
        {this.render('consequent')}
      </node>
    )
  },
  ReturnStatement(node, state) {
    return (
      <statement>
        <keyword>return</keyword>
        {node.argument ? this.render('argument') : null}
      </statement>
    )
  },
  ThrowStatement(node, state) {
    return (
      <statement>
        <keyword>throw</keyword>
        {this.render('argument')}
      </statement>
    )
  },
  CatchClause(node) {
    return (
      <node>
        <keyword>catch</keyword>
        {node.param ? makeBlock({
          boundaries: ParenthesisBoundary,
          children: this.render('param')
        }) : null}
        {this.render('body')}
      </node>
    )
  },
  TryStatement(node, state) {
    return (
      <statement>
        <keyword>try</keyword>
        {this.render('block')}
        {node.handler ? this.render('handler') : null}
        {node.finalizer ? makeBlock({
          keyword: 'finally',
          boundaries: BracketBoundary,
          children: this.render('finalizer')
        }) : null}
      </statement>
    )
  },
  WhileStatement(node, state) {
    return makeBlock({
      keyword: 'while',
      boundaries: ParenthesisBoundary,
      children: this.render('test'),
      next: this.render('body'),
    })
  },
  DoWhileStatement(node, state) {
    return (
      <statement>
        {makeBlock({
          keyword: 'do',
          boundaries: BracketBoundary,
          children: this.render('body')
        })}
        {makeBlock({
          keyword: 'while',
          boundaries: ParenthesisBoundary,
          children: this.render('test')
        })}
      </statement>
    )
  },
  ForStatement(node, state) {
    return makeBlock({
      keyword: 'for',
      boundaries: ParenthesisBoundary,
      children: withSeparator([
        this.render('init'),
        this.render('test'),
        this.render('update'),
      ], ';'),
      next: this.render('body')
    })
  },
  ForInStatement: (ForInStatement = function (node, state) {
    const keywords = ['for']
    if (node.await) keywords.push('await')

    return makeBlock({
      keyword: keywords,
      boundaries: ParenthesisBoundary,
      children: [this.render('left'), (node.type[3] === 'I' ? ' in ' : ' of '), this.render('right')],
      next: this.render('body')
    })
  }),
  ForOfStatement: ForInStatement,
  DebuggerStatement(node, state) {
    return <statement>debugger</statement>
  },
  FunctionDeclaration: (FunctionDeclaration = function (node, state) {
    const keywords =  [`function${node.generator ? '*' : ''}`]
    if (node.async) keywords.unshift('async')
    return makeDeclaration({
      keyword: keywords,
      variable: { value: node.id.name, role: 'function.id' },
      boundaries: ParenthesisBoundary,
      children: addSeparatorToChildren(this.render('params', { role: 'function.param' }), ','),
      next: this.render('body')
    })
  }),
  VariableDeclaration(node, state) {
    return makeDeclaration({
      keyword: node.kind,
      children: addSeparatorToChildren(this.render('declarations'), ',')
    })
  },
  VariableDeclarator(node, state) {
    return (
      <node>
        <variable>{node.id.name}</variable>
        <operator>=</operator>
        {node.init ? this.render('init') : null}
      </node>
    )
  },
  ClassDeclaration(node, state) {
    return (
      <>
        <keyword>class</keyword>
        <variable role="class.id">{node.id.name}</variable>
        {node.superClass ? <keyword>extends</keyword> : null}
        {node.superClass ? this.render('superClass') : null}
        {withBoundary(BracketBoundary, this.render('body'))}
      </>
    )
  },
  ImportDeclaration(node, state) {
    // CAUTION 这两个只可能有一个
    const defaultSpecifier = node.specifiers.filter(({ type }) => type === 'ImportDefaultSpecifier')[0]
    const importNamespaceSpecifier = node.specifiers.filter(({ type }) => type === 'ImportNamespaceSpecifier')[0]

    const specifiers = node.specifiers.filter(({ type }) => type === 'ImportSpecifier')

    return (
      <declaration>
        <keyword>import</keyword>
        {defaultSpecifier ?
          <variable role='import.local.default'>{defaultSpecifier.local.name}</variable> : null}
        {importNamespaceSpecifier ?
          <variable role='import.local.namespace'>{importNamespaceSpecifier.local.name}</variable>
          : null
        }
        {specifiers.length ? makeBlock({
          boundaries: BracketBoundary,
          children: withSeparator(specifiers.map(specifier => {
            const isSameName = specifier.imported.name === specifier.local.name
            return isSameName ?
              <variable>{specifier.local.name}</variable> :
              <>
                <keyword>{specifier.imported.name}</keyword>
                <keyword>as</keyword>
                <variable role='import.local'>{specifier.local.name}</variable>
              </>
          }), ',')
        }) : null}
        <keyword>from</keyword>
        {this.render('source')}
      </declaration>
    )
  },
  ImportDefaultSpecifier(node) {
    return <variable role='import.local.default'>{node.local.name}</variable>
  },
  ImportSpecifier(node) {
    return (
      <>
        <keyword>{node.imported.name}</keyword>
        <keyword>as</keyword>
        <variable role='import.local'>{node.local.name}</variable>
      </>
    )
  },
  ImportNamespaceSpecifier(node) {
    return (
      <>
        <keyword>*</keyword>
        <keyword>as</keyword>
        <variable role='import.local.namespace'>{node.local.name}</variable>
      </>
    )
  },
  ExportDefaultDeclaration(node, state) {
    return (
      <declaration>
        <keyword>export</keyword>
        <keyword>default</keyword>
        {this.render('declaration')}
      </declaration>
    )
  },
  ExportNamedDeclaration(node, state) {
    return (
      <declaration>
        <keyword>export</keyword>
        {
          node.declaration ?
            this.render('declaration') :
            withBoundary(BracketBoundary, addSeparatorToChildren(this.render('specifiers')))
        }
      </declaration>
    )
  },
  ExportSpecifier(node) {
    return (
      <>
        <variable>{node.local.name}</variable>
        {node.exported ? <keyword>as</keyword> : null}
        {node.exported ? <variable role='export.name'>{node.exported.name}</variable> : null}
      </>
    )
  },
  ExportAllDeclaration(node, state) {
    return (
      <declaration>
        <keyword>export</keyword>
        <keyword>*</keyword>
        <keyword>from</keyword>
        {makeStatement({
          boundaries: ['"', '"'],
          children: <literal role="export.source">{node.source}</literal>
        })}
      </declaration>
    )
  },
  MethodDefinition(node, state) {
    return (
      <>
        {node.static ? <keyword>static</keyword> : null}
        {node.kind === 'get' ? <keyword>get</keyword> : null}
        {node.kind === 'set' ? <keyword>set</keyword> : null}
        {node.value.async ? <keyword>async</keyword> : null}
        {node.value.generator ? <keyword>*</keyword> : null}
        {node.computed ? makeBlock({
          boundaries: SquareBracketBoundary,
          children: this.render('key')
        }) : this.render('key')}
        {this.render('value')}
      </>
    )
  },
  FunctionExpression(node) {
    return (
      <expression>
        {makeBlock({
          boundaries: ParenthesisBoundary,
          children: addSeparatorToChildren(this.render('params'), ','),
          next: this.render('body')
        })}
      </expression>
    )
  },
  ClassExpression(node, state) {
    return (
      <expression>
        <keyword>class</keyword>
        <variable role="class.id">{node.id.name}</variable>
        {node.superClass ? <keyword>extends</keyword> : null}
        {node.superClass ? this.render('superClass') : null}
        {makeBlock({
          boundaries: BracketBoundary,
          children: this.render('body')
        })}
      </expression>
    )
  },
  ArrowFunctionExpression(node, state) {
    return (
      <expression>
        {node.async ? <keyword>async</keyword> : null}
        {makeBlock({
          boundaries: ParenthesisBoundary,
          children: addSeparatorToChildren(this.render('params'), ',')
        })}
        <separator>=></separator>
        {node.body.type === 'ObjectExpression' ?
          makeBlock({
            boundaries: ParenthesisBoundary,
            children: this.render('body')
          }) :
          this.render('body')
        }
      </expression>
    )
  },
  ThisExpression(node, state) {
    return <expression><variable role='this'>this</variable></expression>
  },
  Super(node, state) {
    return <expression><variable role='super'>this</variable></expression>
  },
  // TODO
  RestElement: (RestElement = function (node, state) {
    return (
      <>
        <operator>...</operator>
        {this.render('argument')}
      </>
    )
  }),
  SpreadElement: RestElement,
  YieldExpression(node, state) {
    return (
      <expression>
        <keyword>{node.delegate ? 'yield*' : 'yield'}</keyword>
        {this.render('argument')}
      </expression>
    )
  },
  AwaitExpression(node, state) {
    return (
      <expression>
        <keyword>await</keyword>
        {this.render('argument')}
      </expression>
    )
  },
  TemplateLiteral(node, state) {
    const expressionsVNodes = this.render('expressions').children
      .map(expressionVnode => makeBlock({
        boundaries: ['${', '}'],
        children: expressionVnode
      }))

    const children = []
    expressionsVNodes.forEach((vnode, i) => {
      children.push(<literal>{node.quasis[i].value.raw}</literal>)
      children.push(vnode)
    })
    children.push(<literal>{node.quasis[node.quasis.length - 1].value.raw}</literal>)

    return makeBlock({
      boundaries: ['`', '`'],
      children,
    })
  },
  TemplateElement(node, state) {
    return <literal>{node.value.raw}</literal>
  },
  // TODO
  TaggedTemplateExpression(node, state) {
    this.render('tag')
    this.render('quasi')
  },
  ArrayExpression: (ArrayExpression = function (node, state) {
    return (
      <expression>
        {withBoundary(SquareBracketBoundary, addSeparatorToChildren(this.render('elements'), ','))}
      </expression>
    )
  }),
  ArrayPattern: ArrayExpression,
  ObjectExpression(node, state) {
    return (
      <expression>
        {withBoundary(BracketBoundary, addSeparatorToChildren(this.render('properties'), ','))}
      </expression>
    )
  },
  Property(node, state) {
    if (node.method) {
      return (
        <node>
          {node.static ? <keyword>static</keyword> : null}
          {node.kind === 'get' ? <keyword>get</keyword> : null}
          {node.kind === 'set' ? <keyword>set</keyword> : null}
          {node.value.async ? <keyword>async</keyword> : null}
          {node.value.generator ? <keyword>*</keyword> : null}
          {node.computed ? makeStatement({
            boundaries: SquareBracketBoundary,
            children: this.render('key')
          }) : this.render('key')}
          {this.render('value')}
        </node>
      )
    }

    if (node.shorthand) return this.render('value')

    return (
      <node>
        {node.computed ?
          makeStatement({
            boundaries: SquareBracketBoundary,
            children: this.render('key')
          }) :
          this.render('key')
        }
        <separator>:</separator>
        {this.render('value')}
      </node>
    )

  },
  ObjectPattern(node, state) {
    return (
      <pattern>
        {withBoundary(BracketBoundary, addSeparatorToChildren(this.render('properties'), ','))}
      </pattern>
    )
  },
  SequenceExpression(node, state) {
    return (
      <expression>
        {withBoundary(ParenthesisBoundary, addSeparatorToChildren(this.render('expression'), ','))}
      </expression>
    )
  },
  UnaryExpression(node, state) {
    if (!node.prefix) {
      return (
        <expression>
          {this.render('argument')}
          <operator>{node.operator}</operator>
        </expression>
      )
    }

    return (
      <expression>
        <operator>{node.operator}</operator>
        {(EXPRESSIONS_PRECEDENCE[node.argument.type] <
          EXPRESSIONS_PRECEDENCE.UnaryExpression) ?
            withBoundary(ParenthesisBoundary, this.render('argument')):
            this.render('argument')
        }
      </expression>
    )
  },
  UpdateExpression(node, state) {
    return (
      <expression>
        {node.prefix ? <operator>{node.operator}</operator> : null}
        {this.render('argument')}
        {!node.prefix ? <operator>{node.operator}</operator> : null}
      </expression>
    )

  },
  AssignmentExpression(node, state) {
    return (
      <expression>
        {this.render('left')}
        <operator>{node.operator}</operator>
        {this.render('right')}
      </expression>
    )
  },
  AssignmentPattern(node, context) {
    return (
      <pattern>
        {this.render('left')}
        <operator>=</operator>
        {this.render('right')}
      </pattern>
    )
  },
  BinaryExpression: (BinaryExpression = function (node, state) {
    const isIn = node.operator === 'in'

    return makeBlock({
      boundaries: isIn ? ParenthesisBoundary : null,
      children: [
        makeBlock({
          boundaries: expressionNeedsParenthesis(node.left, node, false) ?
            ParenthesisBoundary :
            null,
          children: this.render('left')
        }),
        <operator>{node.operator}</operator>,
        makeBlock({
          boundaries: expressionNeedsParenthesis(node.right, node, true) ?
            ParenthesisBoundary :
            null,
          children: this.render('right')
        })
      ],
    })
  }),
  LogicalExpression: BinaryExpression,
  ConditionalExpression(node, state) {
    return (
      <expression>
        {makeBlock({
          boundaries: (
            EXPRESSIONS_PRECEDENCE[node.test.type] >
            EXPRESSIONS_PRECEDENCE.ConditionalExpression
          ) ? null : ParenthesisBoundary,
          children: this.render('test')
        })}
        <operator>?</operator>
        {this.render('consequent')}
        <operator>:</operator>
        {this.render('alternate')}
      </expression>
    )
  },
  NewExpression(node, state) {
    return (
      <expression>
        <keyword>new</keyword>
        {(EXPRESSIONS_PRECEDENCE[node.callee.type] <
          EXPRESSIONS_PRECEDENCE.CallExpression ||
          hasCallExpression(node.callee)) ?
          makeStatement({
            boundaries: ParenthesisBoundary,
            children: this.render('callee'),
          }) :
          this.render('callee')
        }
        {makeStatement({
          boundaries: ParenthesisBoundary,
          children: addSeparatorToChildren(this.render('arguments'), ',')
        })}
      </expression>
    )
  },
  CallExpression(node, state) {
    const simpleCallee = (
      EXPRESSIONS_PRECEDENCE[node.callee.type] >=
      EXPRESSIONS_PRECEDENCE.CallExpression
    )

    const identifierCallee = node.callee.type === 'Identifier'

    return (
      <expression>
        {makeBlock({
          boundaries: simpleCallee ? null : ParenthesisBoundary,
          // children: simpleCallee ? <variable>{node.callee.name}</variable>: this.render('callee')
          // children: simpleCallee ? <function>{node.callee.name}</function> : this.render('callee')
          children: identifierCallee ? <function>{node.callee.name}</function> : (simpleCallee ? this.render('callee') : this.render('callee'))
        })}
        {makeBlock({
          boundaries: ParenthesisBoundary,
          children: addSeparatorToChildren(this.render('arguments'), ',')
        })}
      </expression>
    )
  },
  MemberExpression(node, state) {
    const simpleObject = (
      EXPRESSIONS_PRECEDENCE[node.object.type] >=
      EXPRESSIONS_PRECEDENCE.MemberExpression
    )

    return (
      <expression>
        {makeBlock({
          boundaries: simpleObject ? null : ParenthesisBoundary,
          // children: simpleObject ? <variable>{node.object.name}</variable> : this.render('object')
          children: simpleObject ? this.render('object') : this.render('object')
        })}
        {node.computed ?
          makeBlock({
            boundaries: SquareBracketBoundary,
            children: (node.property.type === "Identifier") ? <variable>{node.property.name}</variable> : this.render('property')
          }) :
          (<>
            <operator role="member">.</operator>
            {this.render('property')}
          </>)
        }
      </expression>
    )
  },
  MetaProperty(node, state) {
    return (
      <node>
        <variable>{node.meta.name}</variable>
        <operator>.</operator>
        <variable role="property">{node.property.name}</variable>
      </node>
    )
  },
  Identifier(node, state) {
    // console.warn('should not use identifier', node)
    return <identifier>{node.name}</identifier>
  },
  Literal(node, state) {
    if (node.raw != null) {
      return <literal>{node.raw}</literal>
    } else if (node.regex != null) {
      return <literal>/${node.regex.pattern}/${node.regex.flags}</literal>
    } else {
      return <literal>{stringify(node.value)}</literal>
    }
  },
  BooleanLiteral(node, state) {
    return <literal>{node.value}</literal>
  },
  StringLiteral(node, state) {
    return <literal>"{node.value}"</literal>
  },
  NumericLiteral(node, state) {
    return <literal>{node.value}</literal>
  },
  NullLiteral(node, state) {
    return <literal>null</literal>
  },
  RegExpLiteral(node) {
    return <literal>/${node.pattern}/${node.flags}</literal>
  },
  File() {
    return this.render('program')
  }
}

export class State {
  constructor(options = { generator: baseGenerator }) {
    this.generator = options.generator
    this.stack = []
  }

  render(childName, context) {
    const parentNode = this.stack[this.stack.length - 1]
    const node = parentNode[childName]

    if (!Array.isArray(node)) return this.renderOne(node, childName, context)

    return (
      <container data-name={childName}>
        {node.map(child => this.renderOne(child, `${childName}[]`, context))}
      </container>
    )
  }

  renderOne(node, name, context) {
    this.stack.push(node)
    if (!this.generator[node.type]) throw new Error(`unknown node type ${node.type}`)
    const vnode = this.generator[node.type].call(this, node, context)
    this.stack.pop()

    const props = {
      'data-name': name,
      'data-type': node.type
    }

    if (vnode.type === Fragment) {
      return <container {...props}>{vnode.children}</container>
    } else {
      return cloneElement(vnode, props)
    }
  }

  generate(ast) {
    this.stack.push({ ast })
    const result = this.render('ast')
    this.stack.pop()
    return result
  }
}
