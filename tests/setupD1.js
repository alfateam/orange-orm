import { Miniflare } from 'miniflare';

export default async function setupD1(path) {
	const pathSegments = path.split('/');
	const lastSegment = pathSegments[pathSegments.length - 1];
	const fileNameWithoutExtension = lastSegment.split('.')[0];
	let miniflare;
	let d1;
	const sqliteName = `demo.d1.${fileNameWithoutExtension}.db`;

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
	return { miniflare, d1 };
}


