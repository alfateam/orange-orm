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
    name = 'fooProp',
    orderBy = '<orderBy>';

function act(c) {
    c.query = {};
    leg.columns = legColumns;
    leg.name = name;
    leg.span = span;
    span.table = childTable;
    table._primaryColumns = primaryColumns;
    leg.table = table

    c.extractOrderBy.expect(alias, span).return(orderBy);
    c.newShallowJoinSql.expect(table, legColumns, primaryColumns, alias, parentAlias).return(shallowJoin);
    c.newQuery.expect(childTable, span, alias).return(c.query);

    c.query.sql = c.mock();
    c.sql = '<selectSql>';
    c.query.sql.expect().return(c.sql);

    c.expected = ",'fooProp',(select cast(concat('[',ifnull(group_concat(<selectSql><orderBy>),''),']') as json) from <tableName> _1_2 where <shallowJoin>)";

    c.returned = c.sut(parentAlias, leg, legNo);
}

module.exports = act;
