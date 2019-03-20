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
        var column = getTableColumn(property);
        var jsonQuery = getJsonQuery(property, column.alias);
        
        dbNames.push(alias + '.' + column._dbName + jsonQuery + direction);
    }
    
    function getTableColumn(property) {
        var column = table[property] || table[property.split(/(-|#)>+/g)[0]];
        if(!column){
            throw new Error(`Unable to get column on orderBy '${property}'. If jsonb query, only #>, #>>, -> and ->> allowed. Only use ' ' to seperate between query and direction. Does currently not support casting.`);
        }
        return column;
    }
    function getJsonQuery(property, column) {
        let containsJson = (/(-|#)>+/g).test(property);
        if(!containsJson){
            return '';
        }
        return property.replace(column, '');
    }

    return ' order by ' + dbNames.join(',');
}

module.exports = extractOrderBy;
