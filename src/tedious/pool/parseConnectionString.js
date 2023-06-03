var { parseConnectionString } = require('@tediousjs/connection-string');

function parse(connectionString) {
	const config = { options: {useUTC: false}, authentication: { type: 'default', options: {} } };
	const elements = parseConnectionString(connectionString);
	for (const key in elements) {
		const value = elements[key];
		switch (key) {
		case 'uid':
			config.authentication.options.userName = value;
			break;
		case 'pwd':
			config.authentication.options.password = value;
			break;
		case 'server':
			config.server = value.split(',')[0];
			if (value.split(',')[1] !== undefined)
				config.options.port = Number.parseInt(value.split(',')[1]);
			break;
		case 'database':
			config.options.database = value;
			break;
		case 'trustservercertificate':
			config.options.trustServerCertificate = value.toLowerCase() === 'yes';
			break;
		case 'app':
			config.options.appName = value;
			break;
		case 'appname':
			config.options.appName = value;
			break;

		default:
			break;
		}
	}
	return config;
}

module.exports = parse;