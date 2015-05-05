var a = require('a');
var mock = a.mock;
var requireMock = a.requireMock;

function act(c) {
    c.then = a.then;
    c.mock = a.mock;
    c.requireMock = a.requireMock;
    c.rows = {};
    c.span = {};    
    c.x = 'x';
    c.y = 'y';
    c.z = 'z';
    c.xPromise = c.then();
    c.result = [c.xPromise, c.y, c.z];
    c.xPromise.resolve(c.x);
    c.nextResult = [c.y, c.z];
    c.table = {};
    c.span.table = c.table;

    c.promise = requireMock('./promise');
    c.promise.all = mock();
    c.dbRowsToRows = requireMock('./resultToRows/dbRowsToRows');

    c.sut = require('../resultToRows');

    c.dbRowsToRows.expect(c.span, c.x).return(c.rows);

    c.subResultToRows = requireMock('./resultToRows/subResultToRows');
    c.subRows = {};
    c.subRowsPromise = c.then();
    c.subRowsPromise.resolve(c.subRows);
    c.subResultToRows.expect(c.span, c.nextResult).return(c.subRowsPromise);

    c.sut(c.span, c.result).then(onOk, console.log);

    function onOk(returned) {
        c.returned = returned;
    }
}

module.exports = act;
