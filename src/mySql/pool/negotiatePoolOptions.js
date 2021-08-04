function negotiatePoolOptions(pool, options) {
	var config = pool.config;
	for(var name in options) {
		var value = options[name];
		if (name === 'size')
			config.connectionLimit = value;
		else
			config[name] = value;
	}
}

module.exports = negotiatePoolOptions;