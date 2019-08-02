var newUpdateCommandCore = require('./newUpdateCommandCore');
var newImmutable = require('../../newImmutable');
var newColumnList = require('../../newObject');

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
};

UpdateCommand.prototype.matches = function(otherRow) {
	return this._row === otherRow;
};

module.exports = newUpdateCommand;
