function format(template, ...values) {
	let index = 0;
	return template.replace(/%s/g, () => {
		// If there aren't enough values, this will insert 'undefined'
		// for placeholders that don't have a corresponding array item.
		return values[index++];
	});
}
module.exports = format;