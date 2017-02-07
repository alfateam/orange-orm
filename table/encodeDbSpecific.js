var getSessionSingleton = require('./getSessionSingleton');

function encodeDbSpecific(name, value) {
	var encode = getSessionSingleton('encode' + name);
	if (encode)
		return encode(value);
	return value;
}

module.exports = encodeDbSpecific;