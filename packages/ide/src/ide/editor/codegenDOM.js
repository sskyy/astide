/** @jsx createElement */
/** @jsxFrag Fragment */
import createElement, { cloneElement } from '../../base/render/createElement'
import Fragment from '../../base/render/Fragment'
import {
  makeBlock,
  withBoundary,
  withSeparator,
  makeKeyword,
} from '../../base/render/components'
import { invariant } from '../../base/util';

/**
 * TODO
 * 1. 加上分号
 * 2. 加上逗号
 * 3. 加上空格
 */
function addSeparatorToChildren(vnode, separator = ',') {
  return cloneElement(vnode, {},
    ...withSeparator(vnode.children[0].children, separator)
  )
}


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
const JSXOpeningBoundary = ['<', '>']
const JSXSelfClosingBoundary = ['<', '/>']
const JSXClosingBoundary = ['</', '>']

// 为了复用
let ForInStatement,
  FunctionDeclaration,
  RestElement,
  BinaryExpression,
  ArrayExpression,
  BlockStatement,
  MethodDefinition

export const baseGenerator = {
  Program(node, state) {
    return (
      <program>
        {this.render('body')}
      </program>
    )
  },
  BlockStatement: (BlockStatement = function (node, state) {
    return makeBlock({
      boundaries: BracketBoundary,
      children: this.render('body')
    })
  }),
  ClassBody(node) {
    return <>
      {this.render('body')}
    </>
  },
  ClassProperty(node) {
    return (
      <>
        {node.static ? makeKeyword('static') : null}
        {node.computed ? withBoundary(SquareBracketBoundary, this.render('key')) : this.render('key')}
        <operator>=</operator>
        {this.render('value')}
      </>
    )
  },
  MethodDefinition: (MethodDefinition = function(node, state) {
    return (
      <>
        {node.static ? makeKeyword('static') : null}
        {node.kind === 'get' ? makeKeyword('get') : null}
        {node.kind === 'set' ? makeKeyword('set') : null}
        {node.value.async ? makeKeyword('async') : null}
        {node.value.generator ? <keyword>*</keyword> : null}
        {node.computed ? makeBlock({
          boundaries: SquareBracketBoundary,
          children: this.render('key')
        }) : this.render('key')}
        {this.render('params')}
        {this.render('value')}
      </>
    )
  }),
  ClassMethod(node) {
    return (
      <>
        {node.static ? makeKeyword('static') : null}
        {node.kind === 'get' ? makeKeyword('get') : null}
        {node.kind === 'set' ? makeKeyword('set') : null}
        {node.async ? makeKeyword('async') : null}
        {node.generator ? <keyword>*</keyword> : null}
        {node.computed ? makeBlock({
          boundaries: SquareBracketBoundary,
          children: this.render('key')
        }) : this.render('key')}
        {withBoundary(ParenthesisBoundary, this.render('params'))}
        {this.render('body')}
      </>
    )
  },
  EmptyStatement(node, state) {
    return <statement><semicolon>;</semicolon></statement>
  },
  ExpressionStatement(node, state) {
    const precedence = EXPRESSIONS_PRECEDENCE[node.expression.type]
    const boundaries = (
      precedence === NEEDS_PARENTHESES ||
      (precedence === 3 && node.expression.left.type[0] === 'O')
    ) ? ParenthesisBoundary : null

    return makeBlock({
      boundaries,
      children: this.render('expression'),
      semicolon: true,
    })
  },
  IfStatement(node, state) {
    const needBoundary = node.consequent.type !== 'BlockStatement' && node.alternate
    const alternativeNeedBoundary = node.alternate && node.alternate.type !== 'BlockStatement' && node.alternate.type !== 'IfStatement'

    return (
      <>
        {makeBlock({
          keyword: 'if',
          boundaries: ParenthesisBoundary,
          children: this.render('test'),
          next: needBoundary ? withBoundary(BracketBoundary, this.render('consequent')) : this.render('consequent'),
        })}
        {node.alternate ?
          (<>
            {makeKeyword('else')}
            {alternativeNeedBoundary ? withBoundary(BracketBoundary, this.render('alternate')) : this.render('alternate')}
          </>) :
          null
        }
      </>
    )
  },
  LabeledStatement(node, state) {
    return (
      <>
        {this.render('label')}
        <separator>:</separator>
        {this.render('body')}
      </>
    )
  },
  BreakStatement(node, state) {
    return (
      <>
        {makeKeyword('break')}
        {this.render('label')}
        <semicolon>;</semicolon>
      </>
    )
  },
  ContinueStatement(node, state) {
    return (
      <>
        {makeKeyword('continue')}
        {this.render('label')}
        <semicolon>;</semicolon>
      </>
    )
  },
  WithStatement(node, state) {
    return makeBlock({
      keyword: 'with',
      boundaries: ParenthesisBoundary,
      children: this.render('object'),
      next: this.render('body'),
    })
  },
  SwitchStatement(node, state) {
    return makeBlock({
      keyword: 'switch',
      boundaries: ParenthesisBoundary,
      children: this.render('discriminant'),
      next: withBoundary(BracketBoundary, this.render('cases')),
    })
  },
  SwitchCase(node) {
    return (
      <>
        {makeKeyword('case')}
        {this.render('test')}
        <separator>:</separator>
        {this.render('consequent')}
      </>
    )
  },
  ReturnStatement(node, state) {
    return (
      <>
        {makeKeyword('return')}
        {node.argument ? this.render('argument') : null}
        <semicolon>;</semicolon>
      </>
    )
  },
  ThrowStatement(node, state) {
    return (
      <>
        {makeKeyword('throw')}
        {this.render('argument')}
        <semicolon>;</semicolon>
      </>
    )
  },
  CatchClause(node) {
    return (
      <>
        {makeKeyword('catch')}
        {node.param ? makeBlock({
          boundaries: ParenthesisBoundary,
          children: this.render('param')
        }) : null}
        {this.render('body')}
      </>
    )
  },
  TryStatement(node, state) {
    return (
      <>
        {makeKeyword('try')}
        {this.render('block')}
        {node.handler ? this.render('handler') : null}
        {node.finalizer ? makeBlock({
          keyword: 'finally',
          boundaries: BracketBoundary,
          children: this.render('finalizer')
        }) : null}
      </>
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
      <>
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
      </>
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
    return <statement><literal>debugger</literal><semicolon>;</semicolon></statement>
  },
  FunctionDeclaration: (FunctionDeclaration = function (node, state) {
    const keywords =  [`function${node.generator ? '*' : ''}`]
    if (node.async) keywords.unshift('async')
    return makeBlock({
      keyword: keywords,
      variable: { value: node.id.name, role: 'function.id' },
      boundaries: ParenthesisBoundary,
      children: addSeparatorToChildren(this.render('params', { role: 'function.param' }), ','),
      next: this.render('body')
    })
  }),
  VariableDeclaration(node, state) {
    return makeBlock({
      keyword: node.kind,
      children: addSeparatorToChildren(this.render('declarations'), ','),
      semicolon: true
    })
  },
  VariableDeclarator(node, state) {
    return (
      <>
        <variable>{node.id.name}</variable>
        <operator>=</operator>
        {node.init ? this.render('init') : null}
      </>
    )
  },
  ClassDeclaration(node, state) {
    return (
      <>
        {makeKeyword('class')}
        <variable role="class.id">{node.id.name}</variable>
        {node.superClass ? makeKeyword('extends') : null}
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
      <>
        {makeKeyword('import')}
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
                {makeKeyword(specifier.imported.name)}
                {makeKeyword('as')}
                <variable role='import.local'>{specifier.local.name}</variable>
              </>
          }), ',')
        }) : null}
        {makeKeyword('from', true)}
        {this.render('source')}
        <semicolon>;</semicolon>
      </>
    )
  },
  ImportDefaultSpecifier(node) {
    return <variable role='import.local.default'>{node.local.name}</variable>
  },
  ImportSpecifier(node) {
    return (
      <>
        {makeKeyword(node.imported.name)}
        {makeKeyword('as')}
        <variable role='import.local'>{node.local.name}</variable>
      </>
    )
  },
  ImportNamespaceSpecifier(node) {
    return (
      <>
        {makeKeyword('*')}
        {makeKeyword('as')}
        <variable role='import.local.namespace'>{node.local.name}</variable>
      </>
    )
  },
  ExportDefaultDeclaration(node, state) {
    return (
      <>
        {makeKeyword('export')}
        {makeKeyword('default')}
        {this.render('declaration')}
      </>
    )
  },
  ExportNamedDeclaration(node, state) {
    return (
      <>
        {makeKeyword('export')}
        {
          node.declaration ?
            this.render('declaration') :
            withBoundary(BracketBoundary, addSeparatorToChildren(this.render('specifiers')))
        }
      </>
    )
  },
  ExportSpecifier(node) {
    return (
      <>
        <variable>{node.local.name}</variable>
        {node.exported ? makeKeyword('as') : null}
        {node.exported ? <variable role='export.name'>{node.exported.name}</variable> : null}
      </>
    )
  },
  ExportAllDeclaration(node, state) {
    return (
      <>
        {makeKeyword('export')}
        {makeKeyword('*')}
        {makeKeyword('from', true)}
        {makeBlock({
          boundaries: ['"', '"'],
          children: <literal role="export.source">{node.source}</literal>
        })}
        <semicolon>;</semicolon>
      </>
    )
  },

  ObjectMethod(node){
    return (
      <>
        {node.kind === 'get' ? makeKeyword('get') : null}
        {node.kind === 'set' ? makeKeyword('set') : null}
        {node.computed ? makeBlock({
          boundaries: SquareBracketBoundary,
          children: this.render('key')
        }) : this.render('key')}
        {makeBlock({
          boundaries: ParenthesisBoundary,
          children: addSeparatorToChildren(this.render('params'), ',')
        })}
        {this.render('body')}
      </>
    )
  },
  FunctionExpression(node) {
    return (
      <>
        {makeBlock({
          keyword: 'function',
          boundaries: ParenthesisBoundary,
          children: addSeparatorToChildren(this.render('params'), ','),
          next: this.render('body')
        })}
      </>
    )
  },
  ClassExpression(node, state) {
    return (
      <>
        {makeKeyword('class')}
        <variable role="class.id">{node.id.name}</variable>
        {node.superClass ? makeKeyword('extends') : null}
        {node.superClass ? this.render('superClass') : null}
        {makeBlock({
          boundaries: BracketBoundary,
          children: this.render('body')
        })}
      </>
    )
  },
  ArrowFunctionExpression(node, state) {
    return (
      <>
        {node.async ? makeKeyword('async') : null}
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
      </>
    )
  },
  ThisExpression(node, state) {
    return <variable role='this'>this</variable>
  },
  Super(node, state) {
    return <variable role='super'>this</variable>
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
      <>
        {makeKeyword(node.delegate ? 'yield*' : 'yield')}
        {this.render('argument')}
      </>
    )
  },
  AwaitExpression(node, state) {
    return (
      <>
        {makeKeyword('await')}
        {this.render('argument')}
      </>
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
      Tag: 'literal',
      boundaries: ['`', '`'],
      children,
    })
  },
  TemplateElement(node, state) {
    return <literal>{node.value.raw}</literal>
  },
  // TODO
  TaggedTemplateExpression(node, state) {
    return <>
      {this.render('tag')}
      {this.render('quasi')}
    </>
  },
  ArrayExpression: (ArrayExpression = function (node, state) {
    return withBoundary(SquareBracketBoundary, addSeparatorToChildren(this.render('elements'), ','))
  }),
  ArrayPattern: ArrayExpression,
  ObjectExpression(node, state) {
    return withBoundary(BracketBoundary, addSeparatorToChildren(this.render('properties'), ','))
  },
  Property(node, state) {
    if (node.method) {
      return (
        <>
          {node.static ? makeKeyword('static') : null}
          {node.kind === 'get' ? makeKeyword('get') : null}
          {node.kind === 'set' ? makeKeyword('set') : null}
          {node.value.async ? makeKeyword('async') : null}
          {node.value.generator ? makeKeyword('*') : null}
          {node.computed ? makeBlock({
            boundaries: SquareBracketBoundary,
            children: this.render('key')
          }) : this.render('key')}
          {this.render('value')}
        </>
      )
    }

    if (node.shorthand) return this.render('value')

    return (
      <>
        {node.computed ?
          makeBlock({
            boundaries: SquareBracketBoundary,
            children: this.render('key')
          }) :
          this.render('key')
        }
        <separator>:</separator>
        {this.render('value')}
      </>
    )

  },
  ObjectProperty(node) {
    return (
      <>
        {this.render('key')}
        <separator>:</separator>
        {this.render('value')}
      </>
    )
  },
  ObjectPattern(node, state) {
    return withBoundary(BracketBoundary, addSeparatorToChildren(this.render('properties'), ','))
  },
  SequenceExpression(node, state) {
    return withBoundary(ParenthesisBoundary, addSeparatorToChildren(this.render('expression'), ','))
  },
  UnaryExpression(node, state) {
    if (!node.prefix) {
      return (
        <>
          {this.render('argument')}
          <operator>{node.operator}</operator>
        </>
      )
    }

    return (
      <>
        <operator>{node.operator}</operator>
        {(EXPRESSIONS_PRECEDENCE[node.argument.type] <
          EXPRESSIONS_PRECEDENCE.UnaryExpression) ?
            withBoundary(ParenthesisBoundary, this.render('argument')):
            this.render('argument')
        }
      </>
    )
  },
  UpdateExpression(node, state) {
    return (
      <>
        {node.prefix ? <operator>{node.operator}</operator> : null}
        {this.render('argument')}
        {!node.prefix ? <operator>{node.operator}</operator> : null}
      </>
    )

  },
  AssignmentExpression(node, state) {
    return (
      <>
        {this.render('left')}
        <operator>{node.operator}</operator>
        {this.render('right')}
      </>
    )
  },
  AssignmentPattern(node, context) {
    return (
      <>
        {this.render('left')}
        <operator>=</operator>
        {this.render('right')}
      </>
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
      <>
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
      </>
    )
  },
  NewExpression(node, state) {
    return (
      <>
        {makeKeyword('new')}
        {(EXPRESSIONS_PRECEDENCE[node.callee.type] <
          EXPRESSIONS_PRECEDENCE.CallExpression ||
          hasCallExpression(node.callee)) ?
          makeBlock({
            boundaries: ParenthesisBoundary,
            children: this.render('callee'),
          }) :
          this.render('callee')
        }
        {makeBlock({
          boundaries: ParenthesisBoundary,
          children: addSeparatorToChildren(this.render('arguments'), ',')
        })}
      </>
    )
  },
  CallExpression(node, state) {
    const simpleCallee = (
      EXPRESSIONS_PRECEDENCE[node.callee.type] >=
      EXPRESSIONS_PRECEDENCE.CallExpression
    )

    const identifierCallee = node.callee.type === 'Identifier'

    return (
      <>
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
      </>
    )
  },
  MemberExpression(node, state) {
    const simpleObject = (
      EXPRESSIONS_PRECEDENCE[node.object.type] >=
      EXPRESSIONS_PRECEDENCE.MemberExpression
    )

    return (
      <>
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
      </>
    )
  },
  MetaProperty(node, state) {
    return (
      <>
        <variable>{node.meta.name}</variable>
        <operator>.</operator>
        <variable role="property">{node.property.name}</variable>
      </>
    )
  },
  Identifier(node, state) {
    // console.warn('should not use identifier', node)
    return <identifier>{node.name}</identifier>
  },
  BooleanLiteral(node, state) {
    return <literal>{node.value.toString()}</literal>
  },
  StringLiteral(node, state) {
    return <literal>{`"${node.value}"`}</literal>
  },
  NumericLiteral(node, state) {
    return <literal>{node.value}</literal>
  },
  NullLiteral(node, state) {
    return <literal>null</literal>
  },
  RegExpLiteral(node) {
    return <literal>{`/${node.pattern}/${node.flags}`}</literal>
  },
  File() {
    return this.render('program')
  },
  //jsx related
  JSXElement(node) {
    return (
      <>
        {this.render('openingElement')}
        {this.render('children')}
        {node.closingElement ? this.render('closingElement'): null}
      </>
    )
  },
  JSXOpeningElement(node) {
    return withBoundary(node.selfClosing ? JSXSelfClosingBoundary : JSXOpeningBoundary,
          <>
            {this.render('name')}
            <space>{' '}</space>
            {addSeparatorToChildren(this.render('attributes'), ' ')}
          </>
        )
  },
  JSXIdentifier(node) {
    return <identifier>{node.name}</identifier>
  },
  JSXClosingElement(node) {
    return withBoundary(JSXClosingBoundary, this.render('name'))
  },
  JSXSpreadAttribute(node) {
    return withBoundary(BracketBoundary,
          <>
            <operator>...</operator>
            {this.render('argument')}
          </>
    )
  },
  JSXAttribute(node) {
    return (
      <>
        {this.render('name')}
        {node.value!==null ? <operator>=</operator> : null}
        {node.value!==null ? this.render('value'): null}
      </>
    )
  },
  JSXExpressionContainer(node) {
    return withBoundary(BracketBoundary, this.render('expression'))
  },
  JSXFragment(node) {
    return <>
      {this.render('openingFragment')}
      {this.render('children')}
      {node.closingFragment ? this.render('closingFragment') : null}
    </>
  },
  JSXOpeningFragment() {
    return withBoundary(JSXOpeningBoundary, null)
  },
  JSXClosingFragment() {
    return withBoundary(JSXClosingBoundary, null)
  },
  JSXText(node) {
    return <literal>{node.value}</literal>
  }
}

export class Generator {
  constructor(options = { generator: baseGenerator }) {
    this.generator = options.generator
    this.stack = []
  }

  render(childName) {
    const parentNode = this.stack[this.stack.length - 1]
    const node = parentNode[childName]

    return !Array.isArray(node) ?
      this.renderOne(node, childName, parentNode, parentNode) :
      this.renderCollection(node, childName, parentNode)
  }

  renderCollection(node, name, parent) {
    const vnode = (
      <>
        {node.map(child => this.renderOne(child, `${name}[]`, node, parent))}
      </>
    )

    vnode.name = `${name}[]`
    // companion 可以 hijack
    return this.companion ? this.companion({ parent, parentNode: parent, name, node, vnode } ) : vnode
  }


  // renderCollection 再渲染出来的，parent 是 collection 节点，parentNode 才是 node 节点。
  renderOne(node, name, parent, parentNode) {
    this.stack.push(node)
    if (!this.generator[node.type]) {
      throw new Error(`unknown node type ${node.type}`)
    }
    invariant(this.generator[node.type], `unknown node type ${node.type}`)
    const vnode = this.generator[node.type].call(this, node)
    vnode.name = node.type
    const returnVnode = this.companion ? this.companion({ parent, parentNode, name, node, vnode }) : vnode
    this.stack.pop()

    return returnVnode
  }

  // 这里建立的是 ast node 的关系。
  linkNode(inputParent, inputKey, child) {
    // CAUTION 这里的 parent/key 一定要从 child 上面取，因为可能是 generate 中传进来的片段， parent/key 是伪造的。
    // CAUTION 暂时不需要清理，因为child 肯定会被回收。
    child.parent = inputParent
    child.keyName = inputKey

    // CAUTION 这是会暴露出去的 api
    child.closestInCollection = () => {
      const { keyName: key, parent } = child
      const normalizedKey = key.replace(/\[\]$/, '')
      const isArray = Array.isArray(parent[normalizedKey])
      if (isArray) return child
      return child.parent.closestInCollection ? child.parent.closestInCollection() : undefined
    }

    child.replaceWith = (nextChild) => {
      const { keyName: key, parent } = child
      const normalizedKey = key.replace(/\[\]$/, '')
      const isArray = Array.isArray(parent[normalizedKey])
      if (isArray) {
        const collection = parent[normalizedKey]
        const prevIndex = collection.indexOf(child)
        parent[normalizedKey][prevIndex] = nextChild
      } else {
        parent[normalizedKey] = nextChild
      }

      // 这时会修正 generate 中传进来的片段中作为占位符的 parent/key
      this.linkNode(parent, key, nextChild)
    }

    child.append = (sibling) => {
      const { keyName: key, parent } = child
      const normalizedKey = key.replace(/\[\]$/, '')
      const isArray = Array.isArray(parent[normalizedKey])
      invariant(isArray, `child is not in collection , cannot append: ${key}`)

      const collection = parent[normalizedKey]
      const prevIndex = collection.indexOf(child)
      parent[normalizedKey].splice(prevIndex, 1, sibling)

      this.linkNode(parent, key, sibling)
    }
  }

    generate(ast, companion) {
    if (this.stack.length ) throw new Error('generator is not ready')
    this.companion = companion
    this.stack.push({ ast })
    // keyName 可能带 []。这里要 normalize
    const result = this.render('ast')
    this.stack.pop()
    this.companion = null
    if (this.stack.length ) throw new Error('generator is finished correct')
    return result
  }

  walk(node, companion) {
    this.generate(node, companion)
  }

}
