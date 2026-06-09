var newEmitEvent = require('../emitEvent');

var emitters = {
	query: newEmitEvent(),
	queryComplete: newEmitEvent(),
	sqliteOpen: newEmitEvent()
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

log.emitQueryComplete = function({ sql, parameters, elapsedMs, error }) {
	emitters.queryComplete.apply(null, arguments);
};

log.emitSqliteOpen = function(event) {
	emitters.sqliteOpen.apply(null, arguments);
};

log.startQuery = function({ sql, parameters }) {
	const startedAt = now();
	log.emitQuery({ sql, parameters });
	return function(error) {
		log.emitQueryComplete({ sql, parameters, elapsedMs: now() - startedAt, error });
	};
};

log.registerLogger = function(cb) {
	logger = cb;
};

log.on = function(type, cb) {
	if (type === 'query')
		emitters.query.add(cb);
	else if (type === 'queryComplete')
		emitters.queryComplete.add(cb);
	else if (type === 'sqliteOpen')
		emitters.sqliteOpen.add(cb);
	else
		throw new Error('unknown event type: ' + type);
};

log.off = function(type, cb) {
	if (type === 'query')
		emitters.query.tryRemove(cb);
	else if (type === 'queryComplete')
		emitters.queryComplete.tryRemove(cb);
	else if (type === 'sqliteOpen')
		emitters.sqliteOpen.tryRemove(cb);
	else
		throw new Error('unknown event type: ' + type);
};

module.exports = log;

function now() {
	if (typeof performance !== 'undefined' && performance.now)
		return performance.now();
	return Date.now();
}
