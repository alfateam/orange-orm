var popChanges = require('../popChanges');
var executeChanges = require('../executeQueries/executeChanges');
var getSessionContext = require('../getSessionContext');

function flush() {
    var changes = popChanges();
    var context = getSessionContext();
    if (context.flushing) {
        return context.flushing.then(flushCore);
    }

    function flushCore() {
        var p =  executeChanges(changes);
        context.flushing = p;
        return p;
    }

    return flushCore();
}

module.exports = flush;
