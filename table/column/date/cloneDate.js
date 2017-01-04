var toISOString = require('./toISOString');

function cloneDate(date) {
    date = new Date(date);

    Object.defineProperty(date, 'toISOString', {
        enumerable: false,
        configurable: true,
        writable: true,
        value: function() {
            return toISOString(date);
        }
    });
    return date;
}

module.exports = cloneDate;
