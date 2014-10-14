var a = require('a');

function act(c) {
    c.requireMock = a.requireMock;
    c.mock = a.mock;


    c.expected = {};
    c.table = {};
    c.filter = {};
    c.subFilter = 
    c.relations = {};
    c.alias = '_length';
    c.relations.length = 'length';
    c.initialFilter = {};
    c.filterWithDiscriminator = {};

    c.newSubFilter = c.requireMock('./singleCommand/subFilter');
    c.newDiscriminatorSql = c.requireMock('../../query/singleQuery/newDiscriminatorSql');
    c.extractFilter = c.requireMock('../../query/extractFilter');
    c.newSingleCommandCore = c.requireMock('./singleCommand/newSingleCommandCore');

    c.extractFilter.expect(c.initialFilter).return(c.filter);
    c.newSubFilter.expect(c.relations, c.filter).return(c.subFilter);

    c.discriminatorSql = {};
    c.newDiscriminatorSql.expect(c.table, c.alias).return(c.discriminatorSql);

    c.subFilter.and = c.mock();
    c.subFilter.and.expect(c.discriminatorSql).return(c.filterWithDiscriminator);

    c.newSingleCommandCore.expect(c.table, c.filterWithDiscriminator, c.alias).return(c.expected);

    c.newSut = require('../newSingleCommand');
    c.returned = c.newSut(c.table, c.initialFilter, c.relations);

}

module.exports = act;
