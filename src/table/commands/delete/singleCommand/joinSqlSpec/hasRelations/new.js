var relation1 = {};
var relation2 = {};
var joinSql = ' <joinSql>';
var joinSql2 = ' <joinSql2>';

function act(c) {
    c.expected = ' INNER <joinSql> INNER <joinSql2>'
    stubJoin1();
    stubJoin2();

    function stubJoin1() {
        var leftColumns = {};
        var leftTable = {};
        var rightTable = {}
        var rightColumns = {};
        rightTable._primaryColumns = rightColumns;
        relation1.parentTable = leftTable;
        relation1.columns = leftColumns;
        relation1.childTable = rightTable;
        var rightAlias = {};
        c.createAlias.expect(rightTable, 1).return(rightAlias);
        c.newShallowJoinSql.expect(rightTable, leftColumns, rightColumns, '_2', rightAlias).return(joinSql);
    }

    function stubJoin2() {
        var leftColumns = {};
        var leftTable = {};
        var rightTable = {}
        var rightColumns = {};
        rightTable._primaryColumns = rightColumns;
        relation2.parentTable = leftTable;
        relation2.columns = leftColumns;
        relation2.childTable = rightTable;
        var rightAlias = {};
        c.createAlias.expect(rightTable, 0).return(rightAlias);
        c.newShallowJoinSql.expect(rightTable, leftColumns, rightColumns, '_1', rightAlias).return(joinSql2);
    }

    c.returned = c.sut([relation1, relation2]);
}

module.exports = act;
