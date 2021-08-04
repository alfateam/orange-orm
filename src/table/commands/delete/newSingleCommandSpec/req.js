var a = require('a');

function act(c) {
    c.requireMock = a.requireMock;
    c.mock = a.mock;

    c.table = {};
    c.filter = {};
    c.subFilter = 
    c.relations = {};
    c.alias = '_theAlias';
    c.relations.length = {};
    c.initialFilter = {};

    c.newSubFilter = c.requireMock('./singleCommand/subFilter');
    c.newDiscriminatorSql = c.requireMock('../../query/singleQuery/newDiscriminatorSql');
    c.extractFilter = c.requireMock('../../query/extractFilter');
    c.newSingleCommandCore = c.requireMock('./singleCommand/newSingleCommandCore');

    c.extractFilter.expect(c.initialFilter).return(c.filter);
    c.newSubFilter.expect(c.relations, c.filter).return(c.subFilter);
    c.createAlias = c.requireMock('./createAlias');
    c.createAlias.expect(c.table, c.relations.length).return(c.alias);
    
    c.newSut = require('../newSingleCommand');
    

}

module.exports = act;
