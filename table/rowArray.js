var resultToPromise = require('./resultToPromise');
var orderBy = require('./rowArray/orderBy');
var negotiateNextTick = require('./rowArray/negotiateNextTick');
let fuzzyPromise = require('./fuzzyPromise');

function newRowArray() {
	var c = [];

	Object.defineProperty(c, 'toDto', {
		enumerable: false,
		writable: true,
		value: toDtoNativePromise
	});

	Object.defineProperty(c, '__toDto', {
		enumerable: false,
		writable: true,
		value: toDto
	});

	function toDtoNativePromise() {
		let args = [c].concat(Array.prototype.slice.call(arguments));
		if (c.length === 0)
			return fuzzyPromise([]);
		let first = c[0].toDto.apply(c[0],args);
		if (first.then)
			return Promise.resolve().then( () => toDto.apply(null, args));
		else
			return toDtoSync.apply(null, args);
	}

	return c;
}

function toDto(rows, optionalStrategy) {
	var args = Array.prototype.slice.call(arguments).slice(1);
	var result = [];
	var length = rows.length;
	var i = -1;

	return resultToPromise().then(toDtoAtIndex);

	function toDtoAtIndex() {
		i++;
		if (i === length) {
			return orderBy(optionalStrategy, result);
		}
		var row = rows[i];
		return getDto()
			.then(onDto)
			.then(toDtoAtIndex);

		function getDto() {
			return row.__toDto.apply(row,args);
		}

		function onDto(dto) {
			result.push(dto);
			return negotiateNextTick(i);
		}
	}
}

function toDtoSync(rows, optionalStrategy) {
	var args = Array.prototype.slice.call(arguments).slice(1);
	var result = [];
	for (let i = 0; i < rows.length; i++) {
		result[i] = rows[i].toDto.apply(rows[i], args);
	}
	return orderBy(optionalStrategy, result);
}

module.exports = newRowArray;
