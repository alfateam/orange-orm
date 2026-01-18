function isJsonUpdateSupported(engine) {
	return engine === 'pg' || engine === 'mysql' || engine === 'sqlite' || engine === 'mssql' || engine === 'mssqlNative' || engine === 'oracle';
}

module.exports = isJsonUpdateSupported;
