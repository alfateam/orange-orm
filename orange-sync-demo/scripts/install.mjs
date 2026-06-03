import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (!existsSync('vendor/orange-orm-5.2.0.tgz')) {
  const pack = spawnSync('node', ['scripts/pack-orange-orm.mjs'], {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (pack.status !== 0)
    process.exit(pack.status ?? 1);
}

for (const dir of ['client', 'server']) {
  const result = spawnSync('npm', ['install', '--prefix', dir], {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0)
    process.exit(result.status ?? 1);
}
