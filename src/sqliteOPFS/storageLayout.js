function toCachePoolOptions(poolOptions = {}, connectionString) {
	const options = toSecondaryDataPoolOptions(poolOptions, connectionString);
	delete options.sync;
	return options;
}

function toSecondaryDataPoolOptions(poolOptions = {}, connectionString) {
	let options = { ...poolOptions };
	const hadProvidedWorker = !!options.worker;
	delete options.worker;
	if (hadProvidedWorker)
		delete options.closeDbOnClose;
	options = withIsolatedSahPool(options, connectionString);
	return options;
}

function withIsolatedSahPool(poolOptions, connectionString) {
	if (!usesSahPool(poolOptions))
		return poolOptions;
	const source = poolOptions.opfsSahPool || poolOptions.opfsSAHPool || poolOptions.sahPool || {};
	const baseName = nonEmptyString(source.name) || 'opfs-sahpool';
	const baseDirectory = nonEmptyString(source.directory) || `.${baseName}`;
	const token = stableSahPoolToken(connectionString);
	return {
		...poolOptions,
		opfsSahPool: {
			...source,
			name: `${baseName}-orange-${token}`,
			directory: `${baseDirectory}-orange-${token}`
		}
	};
}

function usesSahPool(poolOptions) {
	return poolOptions.vfs === 'opfs-sahpool';
}

function stableSahPoolToken(value) {
	const text = String(value || 'default');
	let hash = 2166136261;
	for (let i = 0; i < text.length; i++) {
		hash ^= text.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0).toString(16).padStart(8, '0');
}

function appendRoleSuffix(connectionString, suffix) {
	const value = String(connectionString);
	if (value.endsWith('.sqlite3'))
		return value.slice(0, -8) + `.__orange_sync_${suffix}.sqlite3`;
	if (value.endsWith('.db'))
		return value.slice(0, -3) + `.__orange_sync_${suffix}.db`;
	return `${value}.__orange_sync_${suffix}.sqlite3`;
}

function nonEmptyString(value) {
	return typeof value === 'string' && value.length > 0 ? value : undefined;
}

module.exports = { appendRoleSuffix, toSecondaryDataPoolOptions, toCachePoolOptions };
