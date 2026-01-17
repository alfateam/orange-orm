var removeFromCache = require('./delete/removeFromCache');
var pushCommand = require('../commands/pushCommand');
var newDeleteCommand = require('../commands/newDeleteCommand');
var newPrimaryKeyFilter = require('../newPrimaryKeyFilter');
var createPatch = require('../../client/createPatch');
var createDto = require('./toDto/createDto');

function _delete(context, row, strategy, table) {
	var relations = [];
	removeFromCache(context, row, strategy, table);

	var args = [context, table];
	table._primaryColumns.forEach(function(primary) {
		args.push(row[primary.alias]);
	});
	var filter = newPrimaryKeyFilter.apply(null, args);
	var concurrencyState = row._concurrencyState;
	delete row._concurrencyState;
	var cmds = newDeleteCommand(context, [], table, filter, strategy, relations, concurrencyState);
	cmds.forEach(function(cmd) {
		pushCommand(context, cmd);
	});
	var cmd = cmds[0];
	var concurrencySummary = summarizeConcurrency(concurrencyState);
	if (concurrencySummary.hasConcurrency) {
		var deleteCmd = cmds[cmds.length - 1];
		deleteCmd.onResult = function(result) {
			var rowCount = extractRowCount(result);
			if (rowCount === undefined)
				return;
			if (rowCount === 0 && concurrencySummary.hasOptimistic) {
				throw new Error('The row was changed by another user.');
			}
		};
	}
	if (table._emitChanged.callbacks.length > 0) {
		cmd.disallowCompress = true;
		var dto = createDto(table, row);
		let patch =  createPatch([dto],[]);
		cmd.emitChanged = table._emitChanged.bind(null, {row: row, patch: patch}); //todo remove ?
	}

}

function summarizeConcurrency(concurrencyState) {
	const summary = { hasConcurrency: false, hasOptimistic: false };
	if (!concurrencyState || !concurrencyState.columns)
		return summary;
	for (let name in concurrencyState.columns) {
		const state = concurrencyState.columns[name];
		if (!state)
			continue;
		const strategy = state.concurrency || 'optimistic';
		if (strategy === 'overwrite')
			continue;
		summary.hasConcurrency = true;
		if (strategy === 'optimistic')
			summary.hasOptimistic = true;
	}
	return summary;
}

function extractRowCount(result) {
	if (Array.isArray(result) && typeof result[0].rowsAffected === 'number')
		return result[0].rowsAffected;
	if (!result || typeof result !== 'object')
		return;
	if (typeof result.rowCount === 'number')
		return result.rowCount;
	if (typeof result.affectedRows === 'number')
		return result.affectedRows;
	if (typeof result.rowsAffected === 'number')
		return result.rowsAffected;
}

module.exports = _delete;
