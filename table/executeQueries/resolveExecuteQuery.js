var getSessionSingleton = require('../getSessionSingleton');
var getChangeSet = require('../commands/getChangeSet');

function resolveExecuteQuery(query) {
    return resolve;

    function resolve(success, failed) {
        var client = getSessionSingleton('dbClient');
        var changeSet = getChangeSet();
        changeSet.queryCount++;
        client.executeQuery(query, onCompleted);

        function onCompleted(err, rows) {
            changeSet.queryCount--;

            if (!err) {
                Object.defineProperty(rows, 'queryContext', {
                    value: query.queryContext,
                    enumerable: false
                });
                success(rows);
            } else
                failed(err);
        }
    }

}

module.exports = resolveExecuteQuery;
