var q1 = {};
var q2 = {};
var queries = [q1, q2];
var a = require('a');
var mock = a.mock;

function act(c) {
    c.expected = {};
    c.changes = [];
    c.changesPromise = {};
    c.queryResult = {};

    c.changesPromise.then = mock();
    c.changesPromise.then.expectAnything().whenCalled(onChangesPromise).return(c.expected);

    function onChangesPromise(next) {
        c.executeQueriesCoreResult = next();
    }

    c.popChanges.expect().return(c.changes);
    c.executeChanges.expect(c.changes).return(c.changesPromise);
    c.executeQueriesCore.expect(queries).return(c.queryResult);

    c.getSessionSingleton.expect('multipleStatements').return(true);

    c.returned = c.sut(queries);
}


module.exports = act;
