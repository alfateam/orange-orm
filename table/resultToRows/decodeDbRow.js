var newDecodeDbRow = require('./newDecodeDbRow');

function decodeDbRow(context, table, dbRow) {
    var decode = context._decodeDbRow;
    if (!decode) {
        decode = newDecodeDbRow(table, dbRow);
        Object.defineProperty(context, '_decodeDbRow', {
            enumerable: false,
            get: function() {
                return decode;
            },
        });
    }
    return decode(dbRow);
}

module.exports = decodeDbRow;
