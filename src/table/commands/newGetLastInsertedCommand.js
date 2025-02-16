var newGetLastInsertedCommandCore = require('./newGetLastInsertedCommandCore');
var newImmutable = require('../../newImmutable');

function newGetLastInsertedCommand(context, table, row, insertCommand) {
	let cmd =  new InsertCommand(context, table, row, insertCommand);
	insertCommand.endEdit = () => {};
	return cmd;
}

function InsertCommand(context, table, row, insertCommand) {
	this._insertCommand = insertCommand;
	this.__getCoreCommand = newImmutable(newGetLastInsertedCommandCore.bind(null, context));
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
	this._insertCommand.endEdit();
	this.sql();
};

Object.defineProperty(InsertCommand.prototype, 'parameters', {
	get: function() {
		return this._getCoreCommand().parameters;

	}
});

Object.defineProperty(InsertCommand.prototype, 'disallowCompress', {
	get: function() {
		return true;
	}
});


module.exports = newGetLastInsertedCommand;
