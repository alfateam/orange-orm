import { describe, test, expect } from 'vitest';
import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

const cliPath = path.join(process.cwd(), 'bin', 'rdb.js');

describe('rdb cli', () => {
	test('prints available commands when no command is provided', () => {
		const cwd = newTmpDir();
		try {
			const result = run([], cwd);
			expect(result.status).toBe(0);
			expect(result.stdout).toContain('Usage:');
			expect(result.stdout).toContain('build');
			expect(result.stdout).toContain('sync:setup');
		} finally {
			fs.rmSync(cwd, { recursive: true, force: true });
		}
	});

	test('returns exit code 1 for unknown command', () => {
		const cwd = newTmpDir();
		try {
			const result = run(['does-not-exist'], cwd);
			expect(result.status).toBe(1);
			expect(result.stderr).toContain('unknown command "does-not-exist"');
			expect(result.stdout).toContain('Usage:');
		} finally {
			fs.rmSync(cwd, { recursive: true, force: true });
		}
	});

	test('returns exit code 1 for removed generate-triggers alias', () => {
		const cwd = newTmpDir();
		try {
			const result = run(['generate-triggers'], cwd);
			expect(result.status).toBe(1);
			expect(result.stderr).toContain('unknown command "generate-triggers"');
			expect(result.stdout).toContain('sync:setup');
		} finally {
			fs.rmSync(cwd, { recursive: true, force: true });
		}
	});
});

function run(args, cwd) {
	return spawnSync(process.execPath, [cliPath, ...args], {
		cwd,
		encoding: 'utf8'
	});
}

function newTmpDir() {
	return fs.mkdtempSync(path.join(os.tmpdir(), 'orange-rdb-cli-'));
}
