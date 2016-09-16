function act(c) {
    c.newSelectQuery.expect([], c.table, c.filter, c.span, c.dbName, c.emptyInnerJoin, undefined, true).return(c.queries);

    return c.sut.exclusive(c.table, c.initialFilter, c.strategy).then(function(ret) {
        c.returned = ret;
    });

}

module.exports = act;
