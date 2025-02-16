let patchTable = require('./patchTable');

function patchRow(context, table, row, patches, options) {
	patches = JSON.parse(JSON.stringify(patches));
	let pkName = table._primaryColumns[0].alias;
	let id = row[pkName];
	for (let i = 0; i < patches.length; i++) {
		patches[i].path = '/' + id + patches[i].path;
	}
	return patchTable(context, table, patches, options);
}

module.exports = patchRow;