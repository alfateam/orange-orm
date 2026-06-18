function isJsonUpdateSupported(engine) {
	return engine === 'pg' || engine === 'mysql' || engine === 'mariadb' || engine === 'sqlite' || engine === 'mssql' || engine === 'mssqlNative' || engine === 'oracle';
}

module.exports = isJsonUpdateSupported;
