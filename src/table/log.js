var newEmitEvent = require('../emitEvent');

var emitters = {
	query: newEmitEvent()
};

var logger = function() {
};

function log() {
	logger.apply(null, arguments);
}
function emitQuery({ sql, parameters }) {
	emitters.query.apply(null, arguments);
	log(sql);
	log('parameters: ' + parameters);
}

log.emitQuery = emitQuery;

log.registerLogger = function(cb) {
	logger = cb;
};

log.on = function(type, cb) {
	if (type === 'query')
		emitters.query.add(cb);
	else
		throw new Error('unknown event type: ' + type);
};

log.off = function(type, cb) {
	if (type === 'query')
		emitters.query.tryRemove(cb);
	else
		throw new Error('unknown event type: ' + type);
};

module.exports = log;