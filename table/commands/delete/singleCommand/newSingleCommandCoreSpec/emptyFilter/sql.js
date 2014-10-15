function act(c) {
    c.expected = c.deleteSql;
    c.filter.sql.expect().return('');

    c.returned = c.sut.sql();
}

module.exports = act;
