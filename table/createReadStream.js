var extractFilter = require('./query/extractFilter');
var cloneStrategy = require('./cloneStrategy');
var domain = require('domain');
var defaultBatchSize = 200;
var Readable = require('stream').Readable;

function createReadStream(table, db, filter, strategy, streamOptions) {
    filter = extractFilter(filter);
    var batchFilter;
    strategy = cloneStrategy(strategy);
    var originalOrderBy =  strategy.orderBy || [];
    calculateOrderBy();
    streamOptions = streamOptions || {};
    var batchSize = streamOptions.batchSize || defaultBatchSize;
    var maxRows = strategy.limit;
    var currentRowCount = 0;
    var busy;
    var waitingforMore;
    var dtos = [];
    var lastDto;

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
    var originalDomain = process.domain || domain.create();
    originalDomain.add(stream);

    function getDtos() {
        busy = true;
        return db.transaction()
            .then(getBatch)
            .then(onRows)
            .then(onDtos)
            .then(db.commit)
            .then(null, onError)
    }

    function onRows(rows) {
        currentRowCount += rows.length;
        return rows.toDto(strategy);
    }

    function onDtos(result) {
        busy = false;
        currentRowCount += result.length;
        lastDto = result[result.length-1];
        dtos = dtos.concat(result);
        if (currentRowCount >= maxRows || result.length < batchSize)
            dtos.push(null);
        negotiatePushStream();
    }

    function negotiatePushStream() {
        if (!waitingforMore)
            return;
        waitingforMore = false;
        stream.push(dtos.shift());
    }

    function getBatch() {
        calculateLimit();
        calculateBatchFilter();
        calculateOrderBy();
        return table.getMany(filter, strategy);
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
        if (!lastDto) {
            batchFilter = filter;
            return;
        }
        //     orderBy.forEach(function(order) {
        // var elements = order.split(' ');
        // var name = elements[0];
        // var direction = elements[1] || 'asc';

        // var compare;
        // if (direction === 'asc')
        //     comparers.push(compareAscending);
        // else
        //     comparers.push(compareDescending);

    }


    function onError(e) {
        db.rollback();
        console.log(e.stack);
        stream.emit('error', e);
    }
    return stream;
}

module.exports = createReadStream;
