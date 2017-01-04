function extractOrderBy(table, alias, orderBy, originalOrderBy) {
    var dbNames = [];
    var i;
    if (orderBy) {
        if (typeof orderBy === 'string')
            orderBy = [orderBy];
        for (i = 0; i < orderBy.length; i++) {
            var nameAndDirection = extractNameAndDirection(orderBy[i]);
            pushColumn(nameAndDirection.name, nameAndDirection.direction);
        }
    } else {
        if(originalOrderBy)
            return originalOrderBy;

        for (i = 0; i < table._primaryColumns.length; i++) {
            pushColumn(table._primaryColumns[i].alias);
        }
    }

    function extractNameAndDirection(orderBy) {
        var elements = orderBy.split(' ');
        var direction = '';
        if (elements.length > 1) {
            direction = ' ' + elements[1];
        }
        return {
            name: elements[0],
            direction: direction
        };
    }
    function pushColumn(property, direction) {
        direction = direction || '';
        var column = table[property];
        dbNames.push(alias + '.' + column._dbName + direction);
    }

    return ' order by ' + dbNames.join(',');
}

module.exports = extractOrderBy;
