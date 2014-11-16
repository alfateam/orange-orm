var release = require('./releaseDbClient');

function tryReleaseDbClient() {
    try {
        release();
    } 
    catch (e) {

    }

}

module.exports = tryReleaseDbClient;
