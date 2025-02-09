// @ts-nocheck

import fs from 'fs';
import esbuild from 'esbuild';
import path, { dirname } from 'path';
import ComptimeDecoratorsPlugin from "../main";
import { fileURLToPath } from 'url';
import * as T from '@babel/types';

const __dirname = dirname(fileURLToPath(import.meta.url));

esbuild.build({
    entryPoints: [path.join(__dirname, 'main.ts')],
    plugins: [
        ComptimeDecoratorsPlugin({
            log(path) {
                if (!path.parentPath.isClassMethod() && !path.parentPath.isFunctionDeclaration()) {
                    throw new Error("@log só pode ser usado em métodos ou funções");
                }
        
                const fnBody = path.parentPath.get("body");
                if (!fnBody.isBlockStatement()) return;
        
                const logStatement = T.expressionStatement(
                    T.callExpression(T.memberExpression(T.identifier("console"), T.identifier("log")), [
                        T.stringLiteral(`Chamando ${path.parentPath.node.key.name}`)
                    ])
                );
        
                fnBody.node.body.unshift(logStatement);
        
                // Remover o decorador após a transformação
                path.remove();
            }
        })
    ],
    outfile: "out.js"
});