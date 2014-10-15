function act(c) {
    c.expected = 'delete from ' + c.tableName + ' ' + c.alias;
    c.filter.sql.expect().return('');

    c.returned = c.sut.sql();
}

module.exports = act;
