let newUpdateCommandCore = require('./newUpdateCommandCore');
let newImmutable = require('../../newImmutable');
let newColumnList = require('../../newObject');
let createPatch = require('rdb-client').createPatch;
let createDto = require('../resultToRows/toDto/createDto');

function newUpdateCommand(table, column, row) {
	return new UpdateCommand(table, column, row);
}

function UpdateCommand(table, column, row) {
	this._table = table;
	this._row = row;
	this.__getCoreCommand = newImmutable(newUpdateCommandCore);
	this._columnList = newColumnList();
	this._columnList[column.alias] = column;
	this.onFieldChanged = this.onFieldChanged.bind(this);
	row.subscribeChanged(this.onFieldChanged);
}

UpdateCommand.prototype.onFieldChanged = function(row, column) {
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
	let dto = JSON.parse(JSON.stringify(createDto(this._table, this._row)));
	this._patch = createPatch([JSON.parse(this._row._oldValues)],[dto]);
	this._row._oldValues = JSON.stringify(dto);
};

UpdateCommand.prototype.emitChanged = function() {
	return this._table._emitChanged({row: this._row, patch: this._patch});
};

UpdateCommand.prototype.matches = function(otherRow) {
    return this._row == otherRow;
};

module.exports = newUpdateCommand;
