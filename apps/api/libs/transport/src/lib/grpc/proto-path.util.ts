import { join } from 'path';
import { existsSync } from 'fs';

export function getProtoPath(domain: string, file: string): string {
  const prodPath = join(__dirname, 'assets', 'protos', domain, file);

  if (existsSync(prodPath)) {
    return prodPath;
  }
  return join(process.cwd(), 'libs/protos/src/lib', domain, file);
}
