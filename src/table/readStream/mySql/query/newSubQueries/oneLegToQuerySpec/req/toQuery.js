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

    c.extractOrderBy.expect(table, parentAlias).return(orderBy);
    c.newShallowJoinSql.expect(table, legColumns, primaryColumns, alias, parentAlias).return(shallowJoin);
    c.newQuery.expect(childTable, span, alias).return(c.query);

    c.query.sql = c.mock();
    c.sql = '<selectSql>';
    c.query.sql.expect().return(c.sql);

    c.expected = ",'fooProp',(select <selectSql> from <tableName> _1_2 where <shallowJoin><orderBy> LIMIT 1)";

    c.returned = c.sut(parentAlias, leg, legNo);
}

module.exports = act;
