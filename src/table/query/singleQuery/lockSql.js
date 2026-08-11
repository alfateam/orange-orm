const getSessionSingleton = require('../../getSessionSingleton');

function selectLockSql(context, span, alias, exclusive) {
	const lock = collectSelectLock(span, alias, exclusive);
	if (!hasLock(lock))
		return '';
	const encode = getSessionSingleton(context, 'selectForUpdateSql');
	if (!encode)
		return '';
	return encode(context, lock);
}

function tableHintSql(context, span, exclusive) {
	const lock = spanToLock(span, exclusive);
	if (!hasLock(lock))
		return '';
	const encode = getSessionSingleton(context, 'selectForUpdateSql');
	if (!encode || !encode.tableHint)
		return '';
	return encode.tableHint(context, lock);
}

function collectSelectLock(span, alias, exclusive) {
	const lock = {
		aliases: [],
		forUpdate: Boolean(exclusive),
		skipLocked: false
	};
	collect(span, alias, lock);
	if (exclusive && lock.aliases.indexOf(alias) === -1)
		lock.aliases.unshift(alias);
	return lock;
}

function collect(span, alias, lock) {
	if (!span)
		return;
	if (span.forUpdate) {
		lock.forUpdate = true;
		lock.aliases.push(alias);
	}
	if (span.skipLocked)
		lock.skipLocked = true;

	if (!span.legs)
		return;
	const visitor = {};
	visitor.visitJoin = visitJoinedLeg;
	visitor.visitOne = visitJoinedLeg;
	visitor.visitMany = function() {};

	function visitJoinedLeg(leg) {
		collect(leg.span, alias + leg.name, lock);
	}

	span.legs.forEach(leg => leg.accept(visitor));
}

function spanToLock(span, exclusive) {
	return {
		aliases: [],
		forUpdate: Boolean(exclusive || span?.forUpdate),
		skipLocked: Boolean(span?.skipLocked)
	};
}

function hasLock(lock) {
	return Boolean(lock.forUpdate || lock.skipLocked);
}

module.exports = {
	selectLockSql,
	tableHintSql
};
