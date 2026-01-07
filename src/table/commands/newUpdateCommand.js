let newUpdateCommandCore = require('./newUpdateCommandCore');
let newImmutable = require('../../newImmutable');
let newColumnList = require('../../newObject');
var createPatch = require('../../client/createPatch');
let createDto = require('../resultToRows/toDto/createDto');

function newUpdateCommand(context, table, column, row) {
	return new UpdateCommand(context, table, column, row);
}

function UpdateCommand(context, table, column, row) {
	this._table = table;
	this._row = row;
	this.__getCoreCommand = newImmutable(newUpdateCommandCore.bind(null, context));
	this._columnList = newColumnList();
	this._columnList[column.alias] = column;
	this.onFieldChanged = this.onFieldChanged.bind(this);
	row.subscribeChanged(this.onFieldChanged);
	this._concurrencyState = undefined;
	this._concurrencySummary = undefined;
	this._usesReturning = false;
}

UpdateCommand.prototype.onFieldChanged = function(_row, column) {
	this._columnList[column.alias] = column;
};

UpdateCommand.prototype.sql = function() {
	return this._getCoreCommand().sql();
};

Object.defineProperty(UpdateCommand.prototype, 'parameters', {
	get: function() {
		return this._getCoreCommand().parameters;
	}
});

UpdateCommand.prototype._getCoreCommand = function() {
	return this.__getCoreCommand(this._table, this._columnList, this._row, this._concurrencyState);
};

UpdateCommand.prototype.endEdit = function() {
	this._concurrencyState = this._row._concurrencyState;
	delete this._row._concurrencyState;

	const coreCommand = this._getCoreCommand();
	this._usesReturning = Boolean(coreCommand._usesReturning);
	this._concurrencySummary = summarizeConcurrency(this._concurrencyState);
	if (this._concurrencySummary.hasConcurrency)
		this.onResult = this._onConcurrencyResult.bind(this);

	this._row.unsubscribeChanged(this.onFieldChanged);
	let dto = JSON.parse(JSON.stringify(createDto(this._table, this._row)));
	this._patch = createPatch([JSON.parse(this._row._oldValues)],[dto]);
	this._row._oldValues = JSON.stringify(dto);
};

UpdateCommand.prototype.emitChanged = function() {
	return this._table._emitChanged({row: this._row, patch: this._patch});
};

UpdateCommand.prototype.matches = function(otherRow) {
	return this._row === otherRow;
};

Object.defineProperty(UpdateCommand.prototype, 'disallowCompress', {
	get: function() {
		return this._table._emitChanged.callbacks.length > 0;

	}
});

UpdateCommand.prototype._onConcurrencyResult = function(result) {
	const rowCount = extractRowCount(result, this._usesReturning);
	if (rowCount === undefined)
		return;
	if (rowCount === 0 && this._concurrencySummary.hasOptimistic) {
		throw new Error('The row was changed by another user.');
	}
};

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

function extractRowCount(result, usesReturning) {
	if (usesReturning && Array.isArray(result))
		return result.length;
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

module.exports = newUpdateCommand;
