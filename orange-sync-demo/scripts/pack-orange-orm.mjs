import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const repoPath = new URL('../..', import.meta.url).pathname;
const vendorPath = new URL('../vendor', import.meta.url).pathname;
const tarballPath = new URL('../vendor/orange-orm-5.2.0.tgz', import.meta.url).pathname;
const tempPath = path.join(tmpdir(), `orange-orm-pack-${process.pid}`);

mkdirSync(vendorPath, { recursive: true });
rmSync(tarballPath, { force: true });
rmSync(tempPath, { recursive: true, force: true });

const result = spawnSync('npm', ['pack', repoPath, '--pack-destination', vendorPath], {
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

if (result.status !== 0)
  process.exit(result.status ?? 1);

mkdirSync(tempPath, { recursive: true });
run('tar', ['-xzf', tarballPath, '-C', tempPath]);
rmSync(path.join(tempPath, 'package', 'orange-sync-demo'), { recursive: true, force: true });
rmSync(tarballPath, { force: true });
run('tar', ['-czf', tarballPath, '-C', tempPath, 'package']);
rmSync(tempPath, { recursive: true, force: true });

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0)
    process.exit(result.status ?? 1);
}
