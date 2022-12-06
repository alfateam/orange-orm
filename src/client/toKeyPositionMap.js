const stringify = require('./stringify');
const { v4: uuid } = require('uuid');

function toKeyPositionMap(rows, options) {
	return rows.reduce((map, element, i) => {
		if (options && options.keys && element === Object(element)) {
			let key = [];
			for (let i = 0; i < options.keys.length; i++) {
				let keyName = options.keys[i].name;
				key.push(negotiateTempKey(element[keyName]));
			}
			map[stringify(key)] = i;
		}
		else if ('id' in element)
			map[stringify(element.id)] = i;
		else
			map[i] = i;
		return map;
	}, {});

}

function negotiateTempKey(value) {
	if (value === undefined)
		return `~${uuid()}`;
	else
		return value;
}

module.exports = toKeyPositionMap;