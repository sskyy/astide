import * as acorn from 'acorn';
import jsx from 'acorn-jsx';

const parser = acorn.Parser.extend(jsx())

export default function parse(code) {
  return parser.parse(code)
}
