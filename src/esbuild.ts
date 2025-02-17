import * as T from '@babel/types';
import fs from "fs/promises";
import { Plugin } from "esbuild";
import { DecoratorDeclaration, PARSER_OPTIONS, UNKNOWN_DECORATOR } from "./constants";
import parser from '@babel/parser';
import { extname } from "path";
import _traverse from '@babel/traverse';
import _generate from '@babel/generator';

const traverse: typeof _traverse = typeof _traverse == 'object'
	? (_traverse as any).default
	: _traverse;

const generate: typeof _generate = typeof _generate == 'object'
    ? (_generate as any).default
    : _generate;

const INCLUDE_FILES_REGEX = /\.(t|j)sx?/;

function ComptimeDecorators(declarations: Record<string, DecoratorDeclaration>, parserOptions: parser.ParserOptions = PARSER_OPTIONS, ...args: unknown[]): Plugin {
    return {
        name: "ComptimeDecorators",
        setup(build) {
            build.onLoad({ filter: INCLUDE_FILES_REGEX }, async ({ path }) => {
                const code = await fs.readFile(path, 'utf8');
                const transformedCode = processDecorators(code, path, declarations, parserOptions, args);
                return { contents: transformedCode, loader: extname(path).slice(1) as any };
            });
        }
    } satisfies Plugin;
}

function processDecorators(code: string, path: string, declarations: Record<string, DecoratorDeclaration>, parserOptions: parser.ParserOptions = PARSER_OPTIONS, args: unknown[]): string {
    const ast = parser.parse(code, parserOptions);
    const context = { path, source: code, ast };

    traverse(ast, {
        Decorator(path) {
            const expr = path.node.expression;
            let callback: DecoratorDeclaration | undefined;

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

            callback.bind(context)(path, ...args);
        }
    });

    return generate(ast).code;
}

export default ComptimeDecorators;