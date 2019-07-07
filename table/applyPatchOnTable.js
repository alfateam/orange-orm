var applyPatch = require('./resultToRows/applyPatch');

async function applyPatchOnTable(table, changes, options) {
    for (var index = 0; index < changes.length; index++) {
        var change = Object.assign({}, changes[index]);
        let path = change.path.split('/');
        path.shift();
        let id = path.shift();
        if (!id)
            return;
        let row;
        if (! (change.op === 'add' && path.length === 0))
            row = await table.getById(id);
        change.path = [''].concat(path).join('/');
        await applyPatch(row, table, [change], options);
    }
}

module.exports = applyPatchOnTable;