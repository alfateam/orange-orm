function normalizeOpfsSahPoolOptions(options = {}, connectionString) {
	const source = options.opfsSahPool || options.opfsSAHPool || options.sahPool;
	if (source && source === Object(source))
		return { ...source };
	const token = stableToken(connectionString || options.connectionString || 'orange.sqlite3');
	return {
		name: `opfs-sahpool-orange-${token}`,
		directory: `.opfs-sahpool-orange-${token}`
	};
}

function stableToken(value) {
	const text = String(value || 'default');
	let hash = 2166136261;
	for (let i = 0; i < text.length; i++) {
		hash ^= text.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0).toString(16).padStart(8, '0');
}

module.exports = normalizeOpfsSahPoolOptions;
