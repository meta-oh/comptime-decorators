import fs from 'fs';
import path, { dirname } from 'path';
import ComptimeDecoratorsPlugin from "../../src/babel";
import { fileURLToPath } from 'url';
import * as T from '@babel/types';
import { transformSync } from '@babel/core';

const __dirname = dirname(fileURLToPath(import.meta.url));

const code = fs.readFileSync(path.join(__dirname, 'main.ts'), 'utf-8');

const transformed = transformSync(code, {
    code: true,
    plugins: [
        ComptimeDecoratorsPlugin({
            log(path) {
                if (!path.parentPath.isClassMethod()) {
                    throw new Error("@log só pode ser usado em métodos ou funções");
                }

                const parent = path.parentPath;
        
                const fnBody = parent.get("body");
                if (!fnBody.isBlockStatement()) return;
        
                const logStatement = T.expressionStatement(
                    T.callExpression(T.memberExpression(T.identifier("console"), T.identifier("log")), [
                        T.stringLiteral(`Chamando ${(parent.node.key as T.Identifier).name}`)
                    ])
                );
        
                fnBody.node.body.unshift(logStatement);
        
                // Remover o decorador após a transformação
                path.remove();
            }
        })
    ],
    presets: ['@babel/preset-typescript'],
    filename: 'main.ts'
});

fs.writeFileSync('out.js', transformed?.code ?? "");
