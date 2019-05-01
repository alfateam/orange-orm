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
    }

    async function replace(row, table, path, change) {
        path.shift();        
        let prop = path[0];
        if (path.length === 1) {     
            let value = change.value;
            let childTable = table._relations[prop] && table._relations[prop].childTable;
            if (childTable) {
                let primaryValues = childTable._primaryColumns.map(function(column) {
                    return value[column.alias];
                });
                let child = childTable.insert.apply(null, primaryValues);
                for(var colName in value) {
                    child[colName] = value[colName];
                }
            }
            else {
                row[prop] = value;
            }
        }
        else {
            let childTable = table._relations[prop] && table._relations[prop].childTable;
            return replace(await row[prop], childTable, path, change);
        }           
    }

    async function add(row, table, path, {value}) {
        path.shift();        
        if (path.length === 1) {            
            let prop = path[0];
            let childTable = table._relations[prop] && table._relations[prop].childTable;
            if (childTable) {
                let primaryValues = childTable._primaryColumns.map(function(column) {
                    return value[column.alias];
                });
                let child = childTable.insert.apply(null, primaryValues);
                for(var colName in value) {
                    child[colName] = value[colName];
                }
            }
        }             
    }
}

module.exports = applyPatch;