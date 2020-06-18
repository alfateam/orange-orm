let patchTable = require('./patchTable');

function patchRow(table, row, patches, options) {
    let pkName = table._primaryColumns[0].alias;
    let id = row[pkName];
    for (let i = 0; i < patches.length; i++) {
        patches[i].path = '/' + id + patches[i].path;
    }
    return patchTable(table, patches, options)
}

module.exports = patchRow;