function act(c) {
    c.newSelectQuery.expect([], c.table, c.filter, c.span, c.dbName, c.emptyInnerJoin, undefined, undefined).return(c.queries);

    return c.sut(c.table, c.initialFilter, c.strategy).then(function(ret) {
        c.returned = ret;
    });

}

module.exports = act;
