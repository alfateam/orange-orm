function act(c) {
    c.relations.length = 'length';

    c.whereSql = ' <whereSql>';
    c.tableName = '<tableName>';
    c.expected = 'delete from <tableName> _length where <subFilter>';
    c.subFilter = {};

    c.table._dbName = c.tableName;
    c.newSubFilter.expect(c.relations, c.filter).return(c.subFilter);
    c.subFilter.sql = c.mock();
    c.sql = '<subFilter>';
    c.subFilter.sql.expect().return(c.sql);

    c.returned = c.sut.sql();
}

act.base = '../new';
module.exports = act;
