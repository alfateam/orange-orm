var newInsertCommandCore = require('./newInsertCommandCore');
var newImmutable = require('../../newImmutable');

function newInsertCommand(table, row) {
    return new InsertCommand(table, row);
    // var c = {};
    // var _getCoreCommand = newImmutable(newInsertCommandCore);

    // c.sql = function() {
    //     return getCoreCommand().sql();
    // };

    // Object.defineProperty(c, 'parameters', {
    //     get: function() {
    //         return getCoreCommand().parameters;
    //     }
    // });

    // function getCoreCommand() {
    //     return _getCoreCommand(table, row);
    // }

    // c.endEdit = c.sql;

    // c.matches = function(otherRow) {
    //     return row == otherRow;
    // };

    // return c;
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
