var release = require('./releaseDbClient');

function tryReleaseDbClient() {
	try {
		release();
	}
	// eslint-disable-next-line no-empty
	catch (e) {

	}

}

module.exports = tryReleaseDbClient;
