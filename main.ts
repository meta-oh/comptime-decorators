import fs from "fs/promises";
import * as T from '@babel/types';
import _traverse, { NodePath } from '@babel/traverse';
import parser from '@babel/parser';
import _generate from '@babel/generator';
import { Plugin } from 'esbuild';
import { extname } from "path";

const traverse: typeof _traverse = typeof _traverse == 'object'
	? (_traverse as any).default
	: _traverse;

const generate: typeof _generate = typeof _generate == 'object'
	? (_generate as any).default
	: _generate;


const INCLUDE_FILES_REGEX = /\.(t|j)sx?/;
const UNKNOWN_DECORATOR = (path) => new Error(`Unknown comptime decorator '${generate(path.node).code}'`);
const PARSER_OPTIONS: parser.ParserOptions = {
    plugins: ['decorators', 'typescript'],
    sourceType: 'module',
}

/**
 * Represents a decorator function that is executed at compile time.
 * 
 * This function receives a Babel `NodePath` pointing to a decorator
 * and has access to contextual information via `this`, including:
 * - `path`: The file path of the source code being processed.
 * - `source`: The original source code as a string.
 * - `ast`: The parsed Abstract Syntax Tree (AST) of the file.
 */
export type DecoratorDeclaration = (this: { path: string, source: string, ast: parser.ParseResult<T.File> }, path: NodePath<T.Decorator>) => unknown;

/**
 * A plugin for esbuild that enables compile-time decorators.
 * 
 * This plugin intercepts files matching `/\.(t|j)sx?/` and processes
 * their AST to execute decorators before the code is bundled.
 * 
 * - It reads and parses the source file.
 * - It traverses the AST to find decorators.
 * - If a decorator matches a registered declaration, it is executed.
 * - The transformed AST is then converted back to code.
 */
function ComptimeDecoratorsPlugin(declarations: Record<string, DecoratorDeclaration>, parserOptions: parser.ParserOptions = PARSER_OPTIONS): Plugin {
    return {
        name: "ComptimeDecorators",
        setup(build) {
            build.onLoad({ filter: INCLUDE_FILES_REGEX }, async (args) => {
                let code = await fs.readFile(args.path, 'utf8');
                const ast = parser.parse(code, parserOptions);

                traverse(ast, {
                    Decorator(path) {
                        const expr = path.node.expression;
                
                        let callback: DecoratorDeclaration | undefined;
                        let callerContext = { path: args.path, source: code, ast };
                
                        switch (true) {
                            case T.isIdentifier(expr): {
                                callback = declarations[expr.name];
                                break;
                            }
                            case T.isCallExpression(expr)
                                && T.isMemberExpression(expr.callee)
                                && T.isIdentifier(expr.callee.object): {
                                callback = declarations[expr.callee.object.name];
                                break;
                            }
                        }
                
                        if (!callback) throw UNKNOWN_DECORATOR(path);
                
                        callback.bind(callerContext)(path);
                    }
                });

                const transformedCode = generate(ast).code;
                                    
                return { contents: transformedCode, loader: extname(args.path).slice(1) as any };
            });
        }
    } satisfies Plugin;
}

export default ComptimeDecoratorsPlugin;
