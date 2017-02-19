var newQuery = require('./readStream/newQuery');
var strategyToSpan = require('./strategyToSpan');
var negotiateRawSqlFilter = require('./column/negotiateRawSqlFilter');
var newQueryStream = require('./readStream/newQueryStream');
var deferred = require('deferred');
var domain = require('domain');

function createReadStreamCoreNative(table, db, filter, strategy, transformer, streamOptions) {
    var alias = table._dbName;
    filter = negotiateRawSqlFilter(filter);
    var span = strategyToSpan(table, strategy);

    var originalDomain = process.domain || domain.create();
    originalDomain.add(transformer);

    var def = deferred();

    db.transaction()
        .then(start)
        .then(db.commit)
        .then(null, onError)

    function start() {
        var query = newQuery(db, table, filter, span, alias);
        var queryStream = newQueryStream(query, streamOptions);
        queryStream.on('end', def.resolve);
        queryStream.on('error', onStreamError);
        queryStream.pipe(transformer);
        return def.promise;
    }

    function onStreamError(e) {
        def.reject(e);
    }

    function onError(e) {
        transformer.emit('error', e);
        db.rollback();
    }

    return transformer;
}

module.exports = createReadStreamCoreNative;