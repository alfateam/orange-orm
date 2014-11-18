var newShallowJoinSql = require('../../../query/singleQuery/joinSql/newShallowJoinSqlCore');

function newWhereSql(relations, shallowFilter) {
    var c = {};
    var sql;
    var relationCount = relations.length;
    var relation = relations[0];
    var leftAlias = '_' + relationCount;
    var rightAlias = '_' + (relationCount-1);
    var table = relation.childTable;
    var leftColumns = relation.columns;
    var rightColumns = table._primaryColumns;
    where(leftColumns, rightColumns);

    function where() {
        var table = relation.childTable;
        var joinCore = newShallowJoinSql(table, leftColumns, rightColumns, leftAlias, rightAlias);
        if (shallowFilter)
            sql = shallowFilter.prepend(' WHERE ' + joinCore + ' AND ');
        else
            sql = ' WHERE ' + joinCore;
    }
    return sql;
}

module.exports = newWhereSql;
