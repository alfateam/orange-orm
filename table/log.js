var logger = function() {
};

function log() {
	logger.apply(null, arguments);
}

log.registerLogger = function(cb) {
	logger = cb;
};

module.exports = log;