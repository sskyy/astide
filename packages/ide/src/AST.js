import { parse } from "@babel/parser"

export default class AST {
  constructor(code) {
    this.ast = parse(code, {
      // parse in strict mode and allow module declarations
      sourceType: "module",
      plugins: []
    })
  }
  getRoot() {
    return this.ast
  }
}