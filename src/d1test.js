import { connect } from '@cloudflare/d1';

const databaseId = process.env.D1_DATABASE_ID;
const accountId = process.env.D1_ACCOUNT_ID;
const apiToken = process.env.D1_API_TOKEN;

export class Database {
	constructor() {
		this.db = connect({
			databaseId,
			accountId,
			apiToken,
		});
	}

	async createUser(name, email) {
		return await this.db
			.prepare('INSERT INTO users (name, email) VALUES (?, ?)')
			.bind(name, email)
			.run();
	}

	async getUsers() {
		return await this.db
			.prepare('SELECT * FROM users')
			.all();
	}

	async getUserById(id) {
		return await this.db
			.prepare('SELECT * FROM users WHERE id = ?')
			.bind(id)
			.first();
	}
}
