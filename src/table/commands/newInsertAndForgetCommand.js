var newInsertCommandCore = require('./newInsertCommandCore');
var newImmutable = require('../../newImmutable');
var createPatch = require('rdb-client').createPatch;
var createDto = require('../resultToRows/toDto/createDto');

function newInsertCommand(table, row, options) {
	return new InsertCommand(table, row, options);
}

function InsertCommand(table, row) {
	this.__getCoreCommand = newImmutable(newInsertCommandCore);
	this._table = table;
	this._row = row;
}

InsertCommand.prototype._getCoreCommand = function() {
	return this.__getCoreCommand(this._table, this._row);
};

InsertCommand.prototype.sql = function() {
	return this._getCoreCommand().sql();
};

InsertCommand.prototype.matches = function(otherRow) {
	return this._row === otherRow;
};


InsertCommand.prototype.endEdit = function() {
	this.sql();
	var dto = createDto(this._table, this._row);
	if (this._table._emitChanged.callbacks.length > 0)
		this._patch = createPatch([], [dto]);
};

InsertCommand.prototype.emitChanged = function() {
	return this._table._emitChanged({row: this._row, patch: this._patch});
};

Object.defineProperty(InsertCommand.prototype, 'parameters', {
	get: function() {
		return this._getCoreCommand().parameters;

	}
});

Object.defineProperty(InsertCommand.prototype, 'disallowCompress', {
	get: function() {
		return this._table._emitChanged.callbacks.length > 0;

	}
});


module.exports = newInsertCommand;
