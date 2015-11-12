var a = require('a');

function act(c) {
    c.mock = a.mock;
    c.requireMock = a.requireMock;
    c.newSelectQuery = c.requireMock('./readStream/newQuery');
    c.executeQuery = c.requireMock('./readStream/executeQuery');
    c.resultToRows = c.requireMock('./readStream/resultToRows');
    c.strategyToSpan = c.requireMock('./strategyToSpan');
    c.negotiateRawSqlFilter = c.requireMock('./column/negotiateRawSqlFilter');
    c.commit = c.requireMock('./commit');
    c.rollback = c.requireMock('./rollback');
    c.newQueryStream = c.requireMock('./readStream/newQueryStream');    

    c.sut = require('../createReadStream');
}

module.exports = act;
