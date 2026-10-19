// Node 24 strips TypeScript; resolve the same source aliases used by Next.js.
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('@/')) return next(pathToFileURL(path.join(root, 'src', specifier.slice(2) + '.ts')).href, context);
    if (specifier.startsWith('.') && context.parentURL?.startsWith('file:') && !path.extname(specifier)) {
      const url = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(url)) return next(url.href, context);
    }
    return next(specifier, context);
  },
});
