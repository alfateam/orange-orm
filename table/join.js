var newJoinRelation = require('./newJoinRelation');
var newRelatedTable = require('./newRelatedTable');

function newJoin(parentTable, childTable) {
    var c = {};
    var columnNames = [];

    c.by = function() {
        for (var i = 0; i < arguments.length; i++) {
            verifyColumnExists(arguments[i]);
            columnNames.push(arguments[i]);
        }
        return c;
    };

    function verifyColumnExists(columnName) {
        var columns = parentTable._columns;
        for (var i = 0; i < columns.length; i++) {
            if (columns[i]._dbName === columnName)
                return;

        }
        throw new Error('Unknown column: ' + columnName);
    }

    c.as = function(alias) {
        var relation = newJoinRelation(parentTable, childTable, columnNames);
        relation.leftAlias = alias;
        parentTable._relations[alias] = relation;

        Object.defineProperty(parentTable, alias, {
            get: function() {
                return newRelatedTable([relation]);
            }
        });

        return relation;
    };
    return c;
}

module.exports = newJoin;
