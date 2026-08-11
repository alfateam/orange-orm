import os from 'node:os';
import path from 'node:path';

const processId = globalThis.process?.pid ?? globalThis.Deno?.pid ?? 'unknown';

export default function sqliteTestPath(fileName) {
	return path.join(os.tmpdir(), `orange-orm-${processId}-${fileName}`);
}
