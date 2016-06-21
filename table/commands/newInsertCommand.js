var newInsertCommandCore = require('./newInsertCommandCore');
var newImmutable = require('../../newImmutable');

function newInsertCommand(table, row) {
    return new InsertCommand(table, row);
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
    return this._row == otherRow;
};

InsertCommand.prototype.endEdit = InsertCommand.prototype.sql;

Object.defineProperty(InsertCommand.prototype, 'parameters', {
    get: function() {
        return this._getCoreCommand().parameters;
    }
});

module.exports = newInsertCommand;
