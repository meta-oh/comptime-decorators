import * as T from '@babel/types';
import parser from '@babel/parser';
import _generate from '@babel/generator';
import { NodePath } from '@babel/traverse';

const generate: typeof _generate = typeof _generate == 'object'
	? (_generate as any).default
	: _generate;

export const UNKNOWN_DECORATOR_ERROR = (path) => new Error(`Unknown comptime decorator '${generate(path.node).code}'`);
export const PARSER_OPTIONS: parser.ParserOptions = {
    plugins: ['decorators', 'typescript'],
    sourceType: 'module',
}

export type DecoratorDeclaration = (this: { path: string, source: string, ast: parser.ParseResult<T.File> }, path: NodePath<T.Decorator>, ...args: unknown[]) => unknown;
