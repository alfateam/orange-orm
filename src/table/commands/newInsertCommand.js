var newImmutable = require('../../newImmutable');
var createPatch = require('../../client/createPatch');
var createDto = require('../resultToRows/toDto/createDto');

function newInsertCommand(newInsertCommandCore, table, row, options) {
	return new InsertCommand(newInsertCommandCore, table, row,  options);
}

function InsertCommand(newInsertCommandCore, table, row, options) {
	this.__getCoreCommand = newImmutable(newInsertCommandCore);
	this._table = table;
	this._row = row;
	this._options = options;
}

InsertCommand.prototype._getCoreCommand = function() {
	return this.__getCoreCommand(this._table, this._row, this._options);
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
	if (this._disallowCompress || this._table._emitChanged.callbacks.length > 0)
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
		return this._disallowCompress || this._table._emitChanged.callbacks.length > 0;

	},
	set: function(value) {
		this._disallowCompress = value;
	}
});


module.exports = newInsertCommand;
