import parser from '@babel/parser';
import traverse from '@babel/traverse';

/**
  * @type {Map}
  */
const insertMap = globalThis.__insertMap__;

export function ReplacerPlugin() {
  /**
   * @type {import('rollup').Plugin}
   */
  const obj ={
    name: "ReplacerPlugin",
    transform(code) {
      const ast = parser.parse(code);

      traverse(ast, {
        enter(path) {
          if (path.node.leadingComments) {
            path.node.leadingComments.forEach((comment) => {
              if (comment.value.includes('@comptime')) {
                const [, match] = comment.value.match(/@comptime (\w+)/);

                if (match && insertMap.has(match)) {
                  path.insertBefore(insertMap.get(match));
                  insertMap.delete(match);
                }
              }
            });
          }
        },
      })
    }
  }

  return obj;
}
