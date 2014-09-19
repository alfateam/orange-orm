function act(c) {
    c.sql = {};
    c.query.sql.expect().return(c.sql);

    c.returned = c.sut(c.query, []);
}

module.exports = act;
