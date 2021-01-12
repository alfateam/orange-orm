let flags = require('./flags');
let versionArray = process.version.replace('v', '').split('.');
let major = parseInt(versionArray[0]);

function useHook() {
	return flags.useHook && major > 7;
}

module.exports = useHook;