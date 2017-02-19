var newQuery = require('./newQuery');
var strategyToSpan = require('./strategyToSpan');
var deferred = require('deferred');
var cloneStrategy = require('./cloneStrategy');
var domain = require('domain');
var defaultBatchSize = 200;
var Readable = require('stream').Readable;

function createReadStreamCore(table, db, filter, strategy, streamOptions) {
    var batchSize = streamOptions.batchSize || defaultBatchSize;
    var maxRows = strategy.limit;
    strategy = cloneStrategy(strategy);
    var currentRowCount = 0;
    var idle = true;
    var waitingForPush;
    var lastDto;
    var isFetching;


    var stream = Readable();

    stream._read = function() {
        getDtos();
        // return getDtos()
        //     .then((dtos) => {
        //         for (var i = 0; i < dtos.length; i++) {
        //             stream.push(dtos[i]);
        //         }
        //     });
        // // if (rows.length > 0) {
        //     waitingForPush = false;
        //     var max = Math.min(batchSize, rows.length);

        //     for (var i = 0; i < max; i++) {
        //         stream.push(rows.shift);
        //     }
        // } else {
        //     waitingForPush = true;
        //     getRows();
        // }
    };

    var originalDomain = process.domain || domain.create();
    originalDomain.add(stream);

    function getDtos() {
        return getRows()
            .then((rows) => rows.toDto(strategy))
            .then((dtos) => {
                for (var i = 0; i < dtos.length; i++) {
                    stream.push(dtos[i]);
                }
                push(null);
            });
    }

    function getRows() {
        return db.transaction()
            .then(getBatch)
            .then(onRows)
            .then(db.commit)
            .then(null, onError);

    }

    function getBatch() {
        calculateLimit();
        return table.getMany(filter, strategy);
    }

    // function onRows(rows) {
    //     var dto;
    //     for (var i = 0; i < rows.length; i++) {
    //         dto = rows[i].toDto(strategy);
    //         stream.push(dto);
    //     }
    //     // if (rows.length < batchSize)
    //     //     stream.push(null);
    //     lastDto = dto;
    // }

    function calculateLimit() {
        // if (maxRows === undefined || maxRows === null)
        //     strategy.limit = batchSize;
        // else {
        //     var rowsLeft = maxRows - currentRowCount;
        //     strategy.limit = Math.min(rowsLeft, batchSize);
        // }
    }

    // function onStreamError(e) {
    //     def.reject(e);
    // }

    function onError(e) {
        db.rollback();
        stream.emit('error', err);
        // transformer.emit('error', e);
    }

    // return transformer;
}

module.exports = createReadStreamCore;
