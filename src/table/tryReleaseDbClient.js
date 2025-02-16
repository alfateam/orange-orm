var release = require('./releaseDbClient');

function tryReleaseDbClient(context) {
	try {
		release(context);
	}
	// eslint-disable-next-line no-empty
	catch (e) {

	}

}

module.exports = tryReleaseDbClient;
