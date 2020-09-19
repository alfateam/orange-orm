var newUpdateCommandCore = require('./newUpdateCommandCore');
var newImmutable = require('../../newImmutable');
var newColumnList = require('../../newObject');
var createPatch = require('rdb-client').createPatch;
var createDto = require('../resultToRows/toDto/createDto');

function newUpdateCommand(table, column, row, oldValue) {
	return new UpdateCommand(table, column, row, oldValue);
}

function UpdateCommand(table, column, row, oldValue) {
	this._table = table;
	this._row = row;
	this.__getCoreCommand = newImmutable(newUpdateCommandCore);
	this._columnList = newColumnList();
	this._columnList[column.alias] = column;
	if (this._table._emitChanged.callbacks.length > 0)  {
		this._oldValues = createDto(table, row);
		this._oldValues[column.alias] = oldValue;
	}
	this.onFieldChanged = this.onFieldChanged.bind(this);
	row.subscribeChanged(this.onFieldChanged);
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
	return this.__getCoreCommand(this._table, this._columnList, this._row);
};

UpdateCommand.prototype.endEdit = function() {
	this._getCoreCommand();
	this._row.unsubscribeChanged(this.onFieldChanged);
	if (this._oldValues) {
		var dto = createDto(this._table, this._row);
		this._patch = createPatch([this._oldValues],[dto]);
	}
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

module.exports = newUpdateCommand;
