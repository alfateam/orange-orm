var parentAlias = '_1',
    leg = {},
    legNo = 2,
    table = {},
    childTable = {
        _dbName: '<tableName>'
    },
    span = {},
    alias = '_1_2',
    spanColumns = {},
    legColumns = {},
    shallowJoin = '<shallowJoin>',
    primaryColumns = {},
    parameterized = {},
    name = 'fooProp';

function act(c) {
    c.query = {};
    leg.name = name;
    leg.columns = legColumns;
    leg.span = span;
    span.table = childTable;
    childTable._primaryColumns = primaryColumns;
    leg.table = table

    c.newShallowJoinSql.expect(table, primaryColumns, legColumns, alias, parentAlias).return(shallowJoin);
    c.newQuery.expect(childTable, span, alias).return(c.query);

    c.query.sql = c.mock();
    c.sql = '<selectSql>';
    c.query.sql.expect().return(c.sql);

    c.expected = ",'fooProp',(select <selectSql> from <tableName> _1_2 where <shallowJoin>)";

    c.returned = c.sut(parentAlias, leg, legNo);
}

module.exports = act;
