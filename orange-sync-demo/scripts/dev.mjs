import { spawn } from 'node:child_process';

const commands = [
  ['server', ['run', 'dev', '--prefix', 'server']],
  ['client', ['run', 'dev', '--prefix', 'client']]
];

const children = commands.map(([name, args]) => {
  const child = spawn('npm', args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: process.platform === 'win32'
  });

  child.stdout.on('data', (chunk) => writePrefixed(name, chunk));
  child.stderr.on('data', (chunk) => writePrefixed(name, chunk));
  child.on('exit', (code, signal) => {
    if (shuttingDown)
      return;
    shuttingDown = true;
    stopChildren();
    process.exit(code ?? (signal ? 1 : 0));
  });

  return child;
});

let shuttingDown = false;

process.on('SIGINT', () => {
  shuttingDown = true;
  stopChildren();
});

process.on('SIGTERM', () => {
  shuttingDown = true;
  stopChildren();
});

function stopChildren() {
  for (const child of children) {
    if (!child.killed)
      child.kill('SIGTERM');
  }
}

function writePrefixed(name, chunk) {
  const text = chunk.toString();
  for (const line of text.split(/\r?\n/)) {
    if (line)
      process.stdout.write(`[${name}] ${line}\n`);
  }
}
