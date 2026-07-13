import { describe, expect, test } from 'vitest';

const rdb = require('../src/client/index');

describe('client commands', () => {
	test('runs registered commands inside an implicit transaction when sync is not configured', async () => {
		const calls = [];
		const context = { rdb: { changes: [], cache: {} } };
		const pool = {
			createTransaction() {
				const transaction = async (fn) => fn(context);
				transaction.commit = () => {
					calls.push(['commit']);
				};
				transaction.rollback = () => {
					calls.push(['rollback']);
				};
				return transaction;
			}
		};
		const db = rdb({
			db: pool,
			commands: {
				async addServerTask(tx, args) {
					calls.push(['command', tx, args.projectId, args.title]);
				}
			}
		});

		await db.commands.addServerTask({ projectId: 7, title: 'From command' });

		expect(calls).toHaveLength(2);
		expect(calls[0][0]).toBe('command');
		expect(calls[0][1]).toBeTypeOf('function');
		expect(calls[0][2]).toBe(7);
		expect(calls[0][3]).toBe('From command');
		expect(calls[1]).toEqual(['commit']);
	});

	test('exposes commands on transaction client', async () => {
		const calls = [];
		const context = { rdb: { changes: [], cache: {} } };
		const pool = {
			createTransaction() {
				const transaction = async (fn) => fn(context);
				transaction.commit = () => {
					calls.push(['commit']);
				};
				transaction.rollback = () => {
					calls.push(['rollback']);
				};
				return transaction;
			}
		};
		const db = rdb({
			db: pool,
			commands: {
				async addServerTask(tx, args) {
					calls.push(['command', tx, args.projectId, args.title]);
				}
			}
		});

		await db.transaction(async (tx) => {
			await tx.commands.addServerTask({ projectId: 8, title: 'From tx' });
		});

		expect(calls).toHaveLength(2);
		expect(calls[0][0]).toBe('command');
		expect(calls[0][1]).toBeTypeOf('function');
		expect(calls[0][2]).toBe(8);
		expect(calls[0][3]).toBe('From tx');
		expect(calls[1]).toEqual(['commit']);
	});

	test('sets low priority on sync-suppressed transactions', async () => {
		const transactionOptions = [];
		const context = { rdb: { changes: [], cache: {} } };
		const pool = {
			createTransaction(options) {
				transactionOptions.push(options);
				const transaction = async (fn) => fn(context);
				transaction.commit = () => {};
				transaction.rollback = () => {};
				return transaction;
			}
		};
		const db = rdb({ db: pool });

		await db.transaction(async () => {}, { suppressSyncOutbox: true });

		expect(transactionOptions).toEqual([
			{ suppressSyncOutbox: true, priority: 1 }
		]);
	});
});
