var newQuery = require('./readStream/newQuery');
var Stream = require('stream');
var strategyToSpan = require('./strategyToSpan');
var negotiateRawSqlFilter = require('./column/negotiateRawSqlFilter');
var newQueryStream = require('./readStream/newQueryStream');
var deferred = require('deferred');
var domain = require('domain');

function createReadStream(table, db, filter, strategy) {
    var alias = table._dbName;
    filter = negotiateRawSqlFilter(filter);
    var span = strategyToSpan(table, strategy);

    var transformer = Stream.Transform({ objectMode: true });

    transformer._transform = function(chunk, enc, cb) {
        transformer.push(JSON.stringify(chunk));
        cb();
    };

    var originalDomain = process.domain || domain.create();
    originalDomain.add(transformer);

    var def = deferred();

    db.transaction()
        .then(start)
        .then(db.commit)
        .then(null, db.rollback)

    function start() {
        var query = newQuery(table, filter, span, alias);
        var queryStream = newQueryStream(query);
        queryStream.pipe(transformer);
        queryStream.on('end', def.resolve);
        queryStream.on('error', onError);

        function onError (e) {
            console.log(e);
            def.reject(e);
            transformer.emit('error', e);
        }

        return def.promise;
    }

    return transformer;
}

module.exports = createReadStream;