async function applyPatch(row, table, changes, options) {
    for (var index = 0; index < changes.length; index++) {
        var change = changes[index];
        if (change.op === 'replace') {
            await remove(row, table, change.path.split('/'), change);
            await add(row, table, change.path.split('/'), change);
        }
        else if (change.op === 'add')
            await add(row, table, change.path.split('/'), change);
        else if (change.op === 'remove')
            await remove(row, table, change.path.split('/'), change);
    }

    async function add(row, table, path, change, relation, isProperty) {
        if (path.length === 1) {
            let prop = path[0];
            let value = change.value;
            if (isProperty)
                return row[prop] = value;
            if (Array.isArray(row)) {
                for (let id in change.value)
                    insert(table, change.value[id], relation);
            } else {
                insert(table, value, relation);
            }
        } else {
            path.shift();
            let prop = path[0];
            let relation = table._relations[prop];
            if (!relation) {
                return add(row, table, path, change, undefined, true);
            }
            if (relation && relation.joinRelation) {
                return add(await row[prop], relation.childTable, path, change, getJoinValues(row, relation));
            }
        }
    }

    function insert(table, value, joinValues) {
        let primaryNames = table._primaryColumns.map(function(column) {
            return column.alias;
        } )
        let primaryValues = table._primaryColumns.map(function (column) {
            return value[column.alias];
        });
        let child = table.insert.apply(null, primaryValues);
        for(var name in joinValues) {
            child[name] = joinValues[name];
        }

        for (var colName in value) {
            if (primaryNames.indexOf(colName) === -1){
                child[colName] = value[colName];
            }
        }
    }

    function getJoinValues(parentRow, relation) {
        var columns = relation.joinRelation.columns;
        var parentKey = table._primaryColumns.map(function(column) {
            return parentRow[column.alias];
        })
        var obj = {};
        for (var index = 0; index < columns.length; index++) {
            var column = columns[index];
            obj[column.alias] = parentKey[index];
        }
        return obj;
    }

    async function remove(row, table, path, change, isProperty) {
        if (path.length === 1) {
            let prop = path[0];
            if (isProperty)
                return row[prop] = undefined;
            if (Array.isArray(row)) {
                for (let index = 0; index < row.length; index++) {
                    await row[index].cascadeDelete();
                }
            } else
                await row.cascadeDelete();
        } else {
            path.shift();
            let prop = path[0];
            let relation = table._relations[prop];
            if (!relation) {
                return remove(row, table, path, change, true);
            }
            if (relation && relation.joinRelation) {
                return remove(await row[prop], relation.childTable, path, change);
            }
        }
    }

}

module.exports = applyPatch;