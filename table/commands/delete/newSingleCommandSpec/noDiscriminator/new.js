function act(c) {
    c.expected = {};

    c.discriminatorSql = '';
    c.newDiscriminatorSql.expect(c.table, c.alias).return(c.discriminatorSql);

    c.newSingleCommandCore.expect(c.table, c.subFilter, c.alias).return(c.expected);

    c.returned = c.newSut(c.table, c.initialFilter, c.relations);

}

module.exports = act;
