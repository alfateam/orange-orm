const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');
// Native bridge contract backed by real on-disk SQLite, including real WAL.
// The raw iOS plugin returns unordered Swift dictionaries plus column metadata.
// Vary key order between rows so tests cannot rely on Node SQLite's SQL order.
function iosRows(rows) {
	return rows.length ? [{ ios_columns: Object.keys(rows[0]) }, ...rows.map((row, i) => {
		const entries = Object.entries(row);
		return Object.fromEntries(i % 2 ? entries.slice(1).concat(entries.slice(0, 1)) : entries.reverse());
	})] : [];
}
module.exports = function nativeSqlitePlugin(directory) {
	const connections = new Map();
	const calls = [];
	let fail;
	function connection(database) { return connections.get(database).db; }
	function before(sql) { calls.push(sql); if (fail && fail(sql)) throw new Error('Injected native failure'); }
	const plugin = {
		failWhen(fn) { fail = fn; },
		async createConnection({ database }) {
			before(`CREATE CONNECTION ${database}`);
			if (connections.has(database)) throw new Error(`CreateConnection: Connection ${database} already exists`);
			connections.set(database, { file: path.join(directory, database + 'SQLite.db') });
		},
		async open({ database }) { const entry = connections.get(database); entry.db = new DatabaseSync(entry.file); },
		async close({ database }) { const entry = connections.get(database); entry.db?.close(); entry.db = null; },
		async closeConnection(args) {
			before(`CLOSE CONNECTION ${args.database}`);
			if (connections.has(args.database)) await this.close(args);
			connections.delete(args.database);
		},
		async deleteDatabase({ database }) {
			before(`DELETE DATABASE ${database}`);
			const entry = connections.get(database);
			await this.close({ database });
			for (const suffix of ['', '-wal', '-shm', '-journal']) fs.rmSync(entry.file + suffix, { force: true });
		},
		async getUrl({ database }) { return { url: 'file://' + connections.get(database).file }; },
		async query({ database, statement, values }) {
			before(statement);
			const rows = connection(database).prepare(statement).all(...values);
			return { values: iosRows(rows) };
		},
		async run({ database, statement, values, transaction, returnMode }) {
			if (transaction) throw new Error('Plugin must not own ORM transactions');
			before(statement);
			if (returnMode === 'all') {
				const rows = connection(database).prepare(statement).all(...values.map(x => Array.isArray(x) ? Uint8Array.from(x) : x));
				const changes = connection(database).prepare('SELECT changes() AS changes, last_insert_rowid() AS lastId').get();
				return { changes: { ...changes, values: iosRows(rows) } };
			}
			const result = connection(database).prepare(statement).run(...values.map(x => Array.isArray(x) ? Uint8Array.from(x) : x));
			return { changes: { changes: result.changes, lastId: result.lastInsertRowid } };
		},
		async execute({ database, statements, transaction }) {
			if (transaction) throw new Error('Plugin must not own ORM transactions');
			before(statements); connection(database).exec(statements); return { changes: {} };
		}
	};
	Object.defineProperty(plugin, "calls", { value: calls });
	return plugin;
};
