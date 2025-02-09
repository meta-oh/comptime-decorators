import * as T from '@babel/types';
import traverse, { NodePath } from '@babel/traverse';
import parser from '@babel/parser';
import generate from '@babel/generator';


const INCLUDE_FILES_REGEX = /\.(t|j)sx?/
const UNKNOWN_DECORATOR = (path) => new Error(`Unknown comptime decorator '${generate(path.node).code}'`);

/**
  * @param {Record<string, (path: NodePath) => any>} declarations
  */
function ComptimeDecoratorsPlugin(declarations) {
  return {
    name: "ComptimeDecorators",
    transform(code, id) {
      if(!INCLUDE_FILES_REGEX.test(id)) return;


      const ast = parser.parse(code);
      traverse(ast, {
        Decorator(path) {
          const expr = path.node.expression;

          switch (true) {
            case T.isIdentifier(expr): {
              const callback = declarations[expr.name];
              if(!callback) throw UNKNOWN_DECORATOR(path);

              callback(path);
              break;
            }
            case T.isCallExpression(expr)
              && T.isMemberExpression(expr.callee)
              && T.isIdentifier(expr.callee.object): 
            {
              const callback = declarations[expr.callee.object.name];
              if(!callback) throw UNKNOWN_DECORATOR(path);

              callback(path);
              break;
            }
          }
        }
      })  
    }
  }
}

export default ComptimeDecoratorsPlugin;
