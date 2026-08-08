import { afterAll, beforeAll, describe, expect, test } from 'vitest';
const rdb = require('../src/index');

const map = rdb.map(x => ({
	item: x.table('aggregateOrderByItem').map(({ column }) => ({
		id: column('id').numeric().primary().notNullExceptInsert(),
		category: column('category').string().notNull(),
		label: column('label').string().notNull(),
	}))
}));

const db = map({ db: con => con.sqlite(':memory:', { size: 1 }) });

beforeAll(async () => {
	await db.query('CREATE TABLE aggregateOrderByItem (id INTEGER PRIMARY KEY, category TEXT NOT NULL, label TEXT NOT NULL)');
	await db.item.insert([
		{ category: 'A', label: 'Zulu' },
		{ category: 'A', label: 'Alpha' },
		{ category: 'B', label: 'Yankee' },
		{ category: 'B', label: 'Bravo' },
		{ category: 'C', label: 'Charlie' },
	]);
});

afterAll(async () => {
	await db.close();
});

describe('aggregate/distinct orderBy', () => {
	test('orders distinct results by multiple aliases before applying limit', async () => {
		const rows = await db.item.distinct({
			category: x => x.category,
			label: x => x.label,
			orderBy: ['category desc', 'label'],
			limit: 2,
		});

		expect(rows).toEqual([
			{ category: 'C', label: 'Charlie' },
			{ category: 'B', label: 'Bravo' },
		]);
	});

	test('orders aggregates by aggregate and grouping aliases', async () => {
		const rows = await db.item.aggregate({
			category: x => x.category,
			count: x => x.count(x => x.id),
			orderBy: ['count desc', 'category desc'],
		});

		expect(rows).toEqual([
			{ category: 'B', count: 2 },
			{ category: 'A', count: 2 },
			{ category: 'C', count: 1 },
		]);
	});

	test('rejects aliases that are not selected', async () => {
		await expect(db.item.aggregate({
			category: x => x.category,
			orderBy: 'missing',
		})).rejects.toThrow(/Unable to get aggregate result on orderBy 'missing'/);
	});
});
