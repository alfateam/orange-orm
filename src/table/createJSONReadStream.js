var createJSONReadStreamDefault = require('./createJSONReadStreamDefault');

function createJSONReadStream(table, db, filter, strategy, streamOptions) {
	return createJSONReadStreamDefault(table, db, filter, strategy, streamOptions);
}

module.exports = createJSONReadStream;
