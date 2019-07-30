var extractFilter = require('./query/extractFilter');
var cloneStrategy = require('./cloneStrategy');
var defaultBatchSize = 200;
var Readable = require('stream').Readable;
var createBatchFilter = require('./readStreamDefault/createBatchFilter');

function createReadStream(table, db, filter, strategy, streamOptions) {
    filter = extractFilter(filter);
    var batchFilter;
    strategy = cloneStrategy(strategy);
    calculateOrderBy();
    streamOptions = streamOptions || {};
    var batchSize = streamOptions.batchSize || defaultBatchSize;
    batchSize = (batchSize + 1) / 2 >> 0;
    var maxRows = strategy.limit;
    var currentRowCount = 0;
    var busy;
    var waitingforMore;
    var dtos = [];
    var lastDto;
    var done;

    var stream = Readable({ objectMode: true });
    stream._read = function() {
        waitingforMore = true;
        if (!busy) {
            if (dtos.length > 0)
                negotiatePushStream();
            else
                getDtos();
        }
    }
    if (process.domain)
        process.domain.add(stream);

    function getDtos() {
        busy = true;
        return db.transaction(async () => {
            await getBatch()
            .then(onRows)
            .then(onDtos)
        })
        .then(negotiatePushStream, onError)
    }

    function onRows(rows) {
        return rows.toDto(strategy);
    }

    function onDtos(result) {
        busy = false;
        currentRowCount += result.length;
        lastDto = result[result.length - 1];
        dtos = dtos.concat(result);
        if (currentRowCount >= maxRows || result.length < batchSize) {
            dtos.push(null);
            done = true;
        }
    }

    function negotiatePushStream() {
        if (dtos.length <= batchSize && !done)
            getDtos();
        if (!waitingforMore)
            return;
        waitingforMore = false;
        stream.push(dtos.shift());
    }

    function getBatch() {
        calculateLimit();
        calculateBatchFilter();
        return table.getMany(batchFilter, strategy);
    }

    function calculateLimit() {
        if (maxRows === undefined || maxRows === null)
            strategy.limit = batchSize;
        else {
            var rowsLeft = maxRows - currentRowCount;
            strategy.limit = Math.min(rowsLeft, batchSize);
        }
    }

    function calculateOrderBy() {
        strategy.orderBy = strategy.orderBy || [];
        if (typeof strategy.orderBy === 'string') {
            strategy.orderBy = [strategy.orderBy];
            originalOrderBy = strategy.orderBy;
        }
        var primaryColumns = table._primaryColumns;
        for (var i = 0; i < primaryColumns.length; i++) {
            strategy.orderBy.push(primaryColumns[i].alias);
        }
    }

    function calculateBatchFilter() {
        batchFilter = createBatchFilter(table, filter, strategy, lastDto);
    }

    function onError(e) {
        stream.emit('error', e);
    }

    return stream;
}

module.exports = createReadStream;
