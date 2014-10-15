function act(c) {
    c.expected = {};
    c.filterWithDiscriminator = {};

    c.discriminatorSql = {};
    c.newDiscriminatorSql.expect(c.table, c.alias).return(c.discriminatorSql);

    c.subFilter.and = c.mock();
    c.subFilter.and.expect(c.discriminatorSql).return(c.filterWithDiscriminator);

    c.newSingleCommandCore.expect(c.table, c.filterWithDiscriminator, c.alias).return(c.expected);

    c.returned = c.newSut(c.table, c.initialFilter, c.relations);

}

module.exports = act;
