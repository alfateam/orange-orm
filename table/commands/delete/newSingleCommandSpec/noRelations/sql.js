function act(c) {
    c.relations.length = 0;

    c.whereSql = ' <whereSql>';
    c.tableName = '<tableName>';
    c.expected = 'delete from <tableName> _0 where <filter>';

    c.table._dbName = c.tableName;
    c.sql = '<filter>';
    c.filter.sql = c.mock();
    c.filter.sql.expect().return(c.sql);

    c.returned = c.sut.sql();
}

act.base = '../new';
module.exports = act;
