async function applyPatch(row, table, changes, options) {
    for (var index = 0; index < changes.length; index++) {
        var change = changes[index];
        if (change.op === 'replace') {
            var path = change.path.split('/');
            await replace(row, table, path, change);
        }
        if (change.op === 'add') {
            var path = change.path.split('/');
            await add(row, table, path, change);
        }
        if (change.op === 'remove') {
            var path = change.path.split('/');
            await remove(row, table, path, change);
        }

    }

    async function replace(row, table, path, change) {
        path.shift();
        let prop = path[0];
        if (path.length === 1) {
            let value = change.value;
            let childTable = table._relations[prop] && table._relations[prop].childTable;
            if (childTable) {
                let primaryValues = childTable._primaryColumns.map(function (column) {
                    return value[column.alias];
                });
                let child = childTable.insert.apply(null, primaryValues);
                for (var colName in value) {
                    child[colName] = value[colName];
                }
            } else {
                row[prop] = value;
            }
        } else {
            let relation = table._relations[prop];
            if (relation && relation.joinRelation) {
                return replace(await row[prop], relation.childTable, path, change);
            }
        }
    }

    async function add(row, table, path, change) {
        path.shift();
        let prop = path[0];
        console.log(prop)
        if (path.length === 1) {
            let value = change.value;
            let childTable = table._relations[prop] && table._relations[prop].childTable;
            if (childTable) {
                let primaryValues = childTable._primaryColumns.map(function (column) {
                    return value[column.alias];
                });
                let child = childTable.insert.apply(null, primaryValues);
                for (var colName in value) {
                    child[colName] = value[colName];
                }
            }
            else {
                row[prop] = value;
            }
        }
        else {
            let relation = table._relations[prop];
            if (relation && relation.joinRelation) {
                return add(await row[prop], relation.childTable, path, change);
            }
        }
    }

    async function remove(row, table, path, change) {
        path.shift();
        let prop = path[0];
        if (path.length === 1) {
            let childTable = table._relations[prop] && table._relations[prop].childTable;
            if (childTable) {
                (await row[prop]).cascadeDelete();
            } else {
                row[prop] = undefined;
            }
        } else {
            let relation = table._relations[prop];
            if (relation && relation.joinRelation) {
                return remove(await row[prop], relation.childTable, path, change);
            }
        }
    }


}

module.exports = applyPatch;