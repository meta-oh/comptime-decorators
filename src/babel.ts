import * as T from '@babel/types';
import { type DecoratorDeclaration, UNKNOWN_DECORATOR_ERROR } from "./constants";
import type { PluginObj } from '@babel/core';
import parser from '@babel/parser';

function ComptimeDecorators(declarations: Record<string, DecoratorDeclaration>, ...args: unknown[]): PluginObj {
    return {
        name: 'comptime-decorators',
        manipulateOptions(opts, parserOpts) {
            parserOpts.plugins ??= [];

            if (!parserOpts.plugins.some((p: any) => Array.isArray(p) ? p[0] === "decorators" : p === "decorators")) {
                parserOpts.plugins.push(["decorators", { decoratorsBeforeExport: true }]);
            }
        },
        visitor: {
            Decorator(path, state) {
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

                if (!callback) throw UNKNOWN_DECORATOR_ERROR(path);

                const context = {
                    path: state.file.opts.filename || '',
                    source: state.file.code || '',
                    ast: state.file.ast as parser.ParseResult<T.File>
                };

                callback.bind(context)(path, ...args);
            }
        }
    } as PluginObj;
}

export default ComptimeDecorators
export type { DecoratorDeclaration }