var getMany = require('./getMany');

function tryGet(table, filter, strategy) {
    return getMany(table, filter, strategy).then(filterRows);
}

function filterRows(rows) {
    if (rows.length > 0)
        return rows[0];
    return null;
}

tryGet.exclusive = function(table, filter, strategy) {
    return getMany.exclusive(table, filter, strategy).then(filterRows);
}

module.exports = tryGet;
