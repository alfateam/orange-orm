function negotiateEndEdit(changes) {
	var last = changes[changes.length - 1];
	if (last && last.endEdit)
		last.endEdit();
}

module.exports = negotiateEndEdit;