import { describe, beforeAll, afterAll, test, expect } from 'vitest';
import { Miniflare } from 'miniflare';
import { fileURLToPath } from 'url';
import path from 'path';

// Determine the SQLite filename dynamically
const pathSegments = fileURLToPath(import.meta.url).split('/');
const lastSegment = pathSegments[pathSegments.length - 1];
const fileNameWithoutExtension = lastSegment.split('.')[0];

let miniflare;
let d1;

async function setupD1() {
	const sqliteName = path.join(__dirname, `demo.d1.${fileNameWithoutExtension}.db`);
	miniflare = new Miniflare({
		modules: true, // Enable module mode explicitly for ES module support
		script: 'export default { fetch() {} };', // Minimal worker script as a module
		d1Databases: {
			DB: sqliteName, // D1 binding
		},
		envPath: true, // Load environment variables from .env if needed
	});

	await miniflare.getBindings();
	d1 = await miniflare.getD1Database('DB');
}

describe('Cloudflare D1 Database Tests', () => {

	beforeAll(async () => {
		await setupD1();
		// Create the table if it doesn’t exist
		await d1.prepare(
			`CREATE TABLE IF NOT EXISTS my_table (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        value INTEGER
      );`
		).run();
	});

	afterAll(async () => {
		await miniflare.dispose();
	});

	test('query database without worker', async () => {
		const result = await d1.prepare('SELECT * FROM my_table').all();
		expect(result).toBeDefined();
		expect(result.results.length).toBe(0);
	});

	test('insert and retrieve data', async () => {
		await d1.prepare('INSERT INTO my_table (name, value) VALUES (?, ?)')
			.bind('test', 123)
			.run();

		const result = await d1.prepare('SELECT * FROM my_table WHERE name = ?')
			.bind('test')
			.all();

		expect(result.results[0].name).toBe('test');
		expect(result.results[0].value).toBe(123);
	});
});
