var newLeg = require('./relation/newJoinLeg'),
    getById = require('./getById');

function _newJoin(parentTable, childTable, columnNames) {
    var c = {};
    c.parentTable = parentTable;
    c.childTable = childTable;
    c.columns = [];
    var columns = parentTable._columns;
    addColumns();

    c.accept = function(visitor) {
        visitor.visitJoin(c);
    };

    c.toLeg = function() {
        return newLeg(c);
    };

    c.getRows = function(parentRow) {
        var primaryKeys = columnNames.map(function(item) {
            return parentRow[item];
        });

        if (primaryKeys.some(isNull)) {
            return null;
        }

        var args = [childTable].concat(primaryKeys);
        return getById.apply(null, args);
    };

    return c;

    function addColumns() {
        var numberOfColumns = columnNames.length;
        for (var i = 0; i < columns.length; i++) {
            curColumn = columns[i];
            tryAdd(curColumn);
            if (numberOfColumns === c.columns.length)
                return;
        };
    };

    function tryAdd(column) {
        for (var i = 0; i < columnNames.length; i++) {
            var name = columnNames[i];
            if (column._dbName === name) {
                c.columns.push(column);
                return;
            }
        };
    }

    function isNull(item) {
        return item === null;
    }
}

module.exports = _newJoin;
