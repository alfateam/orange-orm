void !function() {
	typeof self === 'undefined' && typeof global === 'object'
		? global.self = global : null;
}();var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getAugmentedNamespace(n) {
	if (n.__esModule) return n;
	var a = Object.defineProperty({}, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}

const PATH_SEPARATOR = '.';
const TARGET = Symbol('target');
const UNSUBSCRIBE = Symbol('unsubscribe');

function isBuiltinWithMutableMethods(value) {
	return value instanceof Date
		|| value instanceof Set
		|| value instanceof Map
		|| value instanceof WeakSet
		|| value instanceof WeakMap
		|| ArrayBuffer.isView(value);
}

function isBuiltinWithoutMutableMethods(value) {
	return (typeof value === 'object' ? value === null : typeof value !== 'function') || value instanceof RegExp;
}

var isArray = Array.isArray;

function isSymbol(value) {
	return typeof value === 'symbol';
}

const path = {
	after: (path, subPath) => {
		if (isArray(path)) {
			return path.slice(subPath.length);
		}

		if (subPath === '') {
			return path;
		}

		return path.slice(subPath.length + 1);
	},
	concat: (path, key) => {
		if (isArray(path)) {
			path = [...path];

			if (key) {
				path.push(key);
			}

			return path;
		}

		if (key && key.toString !== undefined) {
			if (path !== '') {
				path += PATH_SEPARATOR;
			}

			if (isSymbol(key)) {
				return path + key.toString();
			}

			return path + key;
		}

		return path;
	},
	initial: path => {
		if (isArray(path)) {
			return path.slice(0, -1);
		}

		if (path === '') {
			return path;
		}

		const index = path.lastIndexOf(PATH_SEPARATOR);

		if (index === -1) {
			return '';
		}

		return path.slice(0, index);
	},
	last: path => {
		if (isArray(path)) {
			return path[path.length - 1] || '';
		}

		if (path === '') {
			return path;
		}

		const index = path.lastIndexOf(PATH_SEPARATOR);

		if (index === -1) {
			return path;
		}

		return path.slice(index + 1);
	},
	walk: (path, callback) => {
		if (isArray(path)) {
			for (const key of path) {
				callback(key);
			}
		} else if (path !== '') {
			let position = 0;
			let index = path.indexOf(PATH_SEPARATOR);

			if (index === -1) {
				callback(path);
			} else {
				while (position < path.length) {
					if (index === -1) {
						index = path.length;
					}

					callback(path.slice(position, index));

					position = index + 1;
					index = path.indexOf(PATH_SEPARATOR, position);
				}
			}
		}
	},
	get(object, path) {
		this.walk(path, key => {
			if (object) {
				object = object[key];
			}
		});

		return object;
	},
};

function isIterator(value) {
	return typeof value === 'object' && typeof value.next === 'function';
}

// eslint-disable-next-line max-params
function wrapIterator(iterator, target, thisArg, applyPath, prepareValue) {
	const originalNext = iterator.next;

	if (target.name === 'entries') {
		iterator.next = function () {
			const result = originalNext.call(this);

			if (result.done === false) {
				result.value[0] = prepareValue(
					result.value[0],
					target,
					result.value[0],
					applyPath,
				);
				result.value[1] = prepareValue(
					result.value[1],
					target,
					result.value[0],
					applyPath,
				);
			}

			return result;
		};
	} else if (target.name === 'values') {
		const keyIterator = thisArg[TARGET].keys();

		iterator.next = function () {
			const result = originalNext.call(this);

			if (result.done === false) {
				result.value = prepareValue(
					result.value,
					target,
					keyIterator.next().value,
					applyPath,
				);
			}

			return result;
		};
	} else {
		iterator.next = function () {
			const result = originalNext.call(this);

			if (result.done === false) {
				result.value = prepareValue(
					result.value,
					target,
					result.value,
					applyPath,
				);
			}

			return result;
		};
	}

	return iterator;
}

function ignoreProperty(cache, options, property) {
	return cache.isUnsubscribed
		|| (options.ignoreSymbols && isSymbol(property))
		|| (options.ignoreUnderscores && property.charAt(0) === '_')
		|| ('ignoreKeys' in options && options.ignoreKeys.includes(property));
}

/**
@class Cache
@private
*/
class Cache {
	constructor(equals) {
		this._equals = equals;
		this._proxyCache = new WeakMap();
		this._pathCache = new WeakMap();
		this.isUnsubscribed = false;
	}

	_getDescriptorCache() {
		if (this._descriptorCache === undefined) {
			this._descriptorCache = new WeakMap();
		}

		return this._descriptorCache;
	}

	_getProperties(target) {
		const descriptorCache = this._getDescriptorCache();
		let properties = descriptorCache.get(target);

		if (properties === undefined) {
			properties = {};
			descriptorCache.set(target, properties);
		}

		return properties;
	}

	_getOwnPropertyDescriptor(target, property) {
		if (this.isUnsubscribed) {
			return Reflect.getOwnPropertyDescriptor(target, property);
		}

		const properties = this._getProperties(target);
		let descriptor = properties[property];

		if (descriptor === undefined) {
			descriptor = Reflect.getOwnPropertyDescriptor(target, property);
			properties[property] = descriptor;
		}

		return descriptor;
	}

	getProxy(target, path, handler, proxyTarget) {
		if (this.isUnsubscribed) {
			return target;
		}

		const reflectTarget = target[proxyTarget];
		const source = reflectTarget || target;

		this._pathCache.set(source, path);

		let proxy = this._proxyCache.get(source);

		if (proxy === undefined) {
			proxy = reflectTarget === undefined
				? new Proxy(target, handler)
				: target;

			this._proxyCache.set(source, proxy);
		}

		return proxy;
	}

	getPath(target) {
		return this.isUnsubscribed ? undefined : this._pathCache.get(target);
	}

	isDetached(target, object) {
		return !Object.is(target, path.get(object, this.getPath(target)));
	}

	defineProperty(target, property, descriptor) {
		if (!Reflect.defineProperty(target, property, descriptor)) {
			return false;
		}

		if (!this.isUnsubscribed) {
			this._getProperties(target)[property] = descriptor;
		}

		return true;
	}

	setProperty(target, property, value, receiver, previous) { // eslint-disable-line max-params
		if (!this._equals(previous, value) || !(property in target)) {
			const descriptor = this._getOwnPropertyDescriptor(target, property);

			if (descriptor !== undefined && 'set' in descriptor) {
				return Reflect.set(target, property, value, receiver);
			}

			return Reflect.set(target, property, value);
		}

		return true;
	}

	deleteProperty(target, property, previous) {
		if (Reflect.deleteProperty(target, property)) {
			if (!this.isUnsubscribed) {
				const properties = this._getDescriptorCache().get(target);

				if (properties) {
					delete properties[property];
					this._pathCache.delete(previous);
				}
			}

			return true;
		}

		return false;
	}

	isSameDescriptor(a, target, property) {
		const b = this._getOwnPropertyDescriptor(target, property);

		return a !== undefined
			&& b !== undefined
			&& Object.is(a.value, b.value)
			&& (a.writable || false) === (b.writable || false)
			&& (a.enumerable || false) === (b.enumerable || false)
			&& (a.configurable || false) === (b.configurable || false)
			&& a.get === b.get
			&& a.set === b.set;
	}

	isGetInvariant(target, property) {
		const descriptor = this._getOwnPropertyDescriptor(target, property);

		return descriptor !== undefined
			&& descriptor.configurable !== true
			&& descriptor.writable !== true;
	}

	unsubscribe() {
		this._descriptorCache = null;
		this._pathCache = null;
		this._proxyCache = null;
		this.isUnsubscribed = true;
	}
}

function isObject(value) {
	return toString.call(value) === '[object Object]';
}

function isDiffCertain() {
	return true;
}

function isDiffArrays(clone, value) {
	return clone.length !== value.length || clone.some((item, index) => value[index] !== item);
}

const IMMUTABLE_OBJECT_METHODS = new Set([
	'hasOwnProperty',
	'isPrototypeOf',
	'propertyIsEnumerable',
	'toLocaleString',
	'toString',
	'valueOf',
]);

const IMMUTABLE_ARRAY_METHODS = new Set([
	'concat',
	'includes',
	'indexOf',
	'join',
	'keys',
	'lastIndexOf',
]);

const MUTABLE_ARRAY_METHODS = {
	push: isDiffCertain,
	pop: isDiffCertain,
	shift: isDiffCertain,
	unshift: isDiffCertain,
	copyWithin: isDiffArrays,
	reverse: isDiffArrays,
	sort: isDiffArrays,
	splice: isDiffArrays,
	flat: isDiffArrays,
	fill: isDiffArrays,
};

const HANDLED_ARRAY_METHODS = new Set([
	...IMMUTABLE_OBJECT_METHODS,
	...IMMUTABLE_ARRAY_METHODS,
	...Object.keys(MUTABLE_ARRAY_METHODS),
]);

function isDiffSets(clone, value) {
	if (clone.size !== value.size) {
		return true;
	}

	for (const element of clone) {
		if (!value.has(element)) {
			return true;
		}
	}

	return false;
}

const COLLECTION_ITERATOR_METHODS = [
	'keys',
	'values',
	'entries',
];

const IMMUTABLE_SET_METHODS = new Set([
	'has',
	'toString',
]);

const MUTABLE_SET_METHODS = {
	add: isDiffSets,
	clear: isDiffSets,
	delete: isDiffSets,
	forEach: isDiffSets,
};

const HANDLED_SET_METHODS = new Set([
	...IMMUTABLE_SET_METHODS,
	...Object.keys(MUTABLE_SET_METHODS),
	...COLLECTION_ITERATOR_METHODS,
]);

function isDiffMaps(clone, value) {
	if (clone.size !== value.size) {
		return true;
	}

	let bValue;
	for (const [key, aValue] of clone) {
		bValue = value.get(key);

		if (bValue !== aValue || (bValue === undefined && !value.has(key))) {
			return true;
		}
	}

	return false;
}

const IMMUTABLE_MAP_METHODS = new Set([...IMMUTABLE_SET_METHODS, 'get']);

const MUTABLE_MAP_METHODS = {
	set: isDiffMaps,
	clear: isDiffMaps,
	delete: isDiffMaps,
	forEach: isDiffMaps,
};

const HANDLED_MAP_METHODS = new Set([
	...IMMUTABLE_MAP_METHODS,
	...Object.keys(MUTABLE_MAP_METHODS),
	...COLLECTION_ITERATOR_METHODS,
]);

class CloneObject {
	constructor(value, path, argumentsList, hasOnValidate) {
		this._path = path;
		this._isChanged = false;
		this._clonedCache = new Set();
		this._hasOnValidate = hasOnValidate;
		this._changes = hasOnValidate ? [] : null;

		this.clone = path === undefined ? value : this._shallowClone(value);
	}

	static isHandledMethod(name) {
		return IMMUTABLE_OBJECT_METHODS.has(name);
	}

	_shallowClone(value) {
		let clone = value;

		if (isObject(value)) {
			clone = {...value};
		} else if (isArray(value) || ArrayBuffer.isView(value)) {
			clone = [...value];
		} else if (value instanceof Date) {
			clone = new Date(value);
		} else if (value instanceof Set) {
			clone = new Set([...value].map(item => this._shallowClone(item)));
		} else if (value instanceof Map) {
			clone = new Map();

			for (const [key, item] of value.entries()) {
				clone.set(key, this._shallowClone(item));
			}
		}

		this._clonedCache.add(clone);

		return clone;
	}

	preferredThisArg(isHandledMethod, name, thisArg, thisProxyTarget) {
		if (isHandledMethod) {
			if (isArray(thisProxyTarget)) {
				this._onIsChanged = MUTABLE_ARRAY_METHODS[name];
			} else if (thisProxyTarget instanceof Set) {
				this._onIsChanged = MUTABLE_SET_METHODS[name];
			} else if (thisProxyTarget instanceof Map) {
				this._onIsChanged = MUTABLE_MAP_METHODS[name];
			}

			return thisProxyTarget;
		}

		return thisArg;
	}

	update(fullPath, property, value) {
		const changePath = path.after(fullPath, this._path);

		if (property !== 'length') {
			let object = this.clone;

			path.walk(changePath, key => {
				if (object && object[key]) {
					if (!this._clonedCache.has(object[key])) {
						object[key] = this._shallowClone(object[key]);
					}

					object = object[key];
				}
			});

			if (this._hasOnValidate) {
				this._changes.push({
					path: changePath,
					property,
					previous: value,
				});
			}

			if (object && object[property]) {
				object[property] = value;
			}
		}

		this._isChanged = true;
	}

	undo(object) {
		let change;

		for (let index = this._changes.length - 1; index !== -1; index--) {
			change = this._changes[index];

			path.get(object, change.path)[change.property] = change.previous;
		}
	}

	isChanged(value) {
		return this._onIsChanged === undefined
			? this._isChanged
			: this._onIsChanged(this.clone, value);
	}
}

class CloneArray extends CloneObject {
	static isHandledMethod(name) {
		return HANDLED_ARRAY_METHODS.has(name);
	}
}

class CloneDate extends CloneObject {
	undo(object) {
		object.setTime(this.clone.getTime());
	}

	isChanged(value, equals) {
		return !equals(this.clone.valueOf(), value.valueOf());
	}
}

class CloneSet extends CloneObject {
	static isHandledMethod(name) {
		return HANDLED_SET_METHODS.has(name);
	}

	undo(object) {
		for (const value of this.clone) {
			object.add(value);
		}

		for (const value of object) {
			if (!this.clone.has(value)) {
				object.delete(value);
			}
		}
	}
}

class CloneMap extends CloneObject {
	static isHandledMethod(name) {
		return HANDLED_MAP_METHODS.has(name);
	}

	undo(object) {
		for (const [key, value] of this.clone.entries()) {
			object.set(key, value);
		}

		for (const key of object.keys()) {
			if (!this.clone.has(key)) {
				object.delete(key);
			}
		}
	}
}

class CloneWeakSet extends CloneObject {
	constructor(value, path, argumentsList, hasOnValidate) {
		super(undefined, path, argumentsList, hasOnValidate);

		this._arg1 = argumentsList[0];
		this._weakValue = value.has(this._arg1);
	}

	isChanged(value) {
		return this._weakValue !== value.has(this._arg1);
	}

	undo(object) {
		if (this._weakValue && !object.has(this._arg1)) {
			object.add(this._arg1);
		} else {
			object.delete(this._arg1);
		}
	}
}

class CloneWeakMap extends CloneObject {
	constructor(value, path, argumentsList, hasOnValidate) {
		super(undefined, path, argumentsList, hasOnValidate);

		this._weakKey = argumentsList[0];
		this._weakHas = value.has(this._weakKey);
		this._weakValue = value.get(this._weakKey);
	}

	isChanged(value) {
		return this._weakValue !== value.get(this._weakKey);
	}

	undo(object) {
		const weakHas = object.has(this._weakKey);

		if (this._weakHas && !weakHas) {
			object.set(this._weakKey, this._weakValue);
		} else if (!this._weakHas && weakHas) {
			object.delete(this._weakKey);
		} else if (this._weakValue !== object.get(this._weakKey)) {
			object.set(this._weakKey, this._weakValue);
		}
	}
}

class SmartClone {
	constructor(hasOnValidate) {
		this._stack = [];
		this._hasOnValidate = hasOnValidate;
	}

	static isHandledType(value) {
		return isObject(value)
			|| isArray(value)
			|| isBuiltinWithMutableMethods(value);
	}

	static isHandledMethod(target, name) {
		if (isObject(target)) {
			return CloneObject.isHandledMethod(name);
		}

		if (isArray(target)) {
			return CloneArray.isHandledMethod(name);
		}

		if (target instanceof Set) {
			return CloneSet.isHandledMethod(name);
		}

		if (target instanceof Map) {
			return CloneMap.isHandledMethod(name);
		}

		return isBuiltinWithMutableMethods(target);
	}

	get isCloning() {
		return this._stack.length > 0;
	}

	start(value, path, argumentsList) {
		let CloneClass = CloneObject;

		if (isArray(value)) {
			CloneClass = CloneArray;
		} else if (value instanceof Date) {
			CloneClass = CloneDate;
		} else if (value instanceof Set) {
			CloneClass = CloneSet;
		} else if (value instanceof Map) {
			CloneClass = CloneMap;
		} else if (value instanceof WeakSet) {
			CloneClass = CloneWeakSet;
		} else if (value instanceof WeakMap) {
			CloneClass = CloneWeakMap;
		}

		this._stack.push(new CloneClass(value, path, argumentsList, this._hasOnValidate));
	}

	update(fullPath, property, value) {
		this._stack[this._stack.length - 1].update(fullPath, property, value);
	}

	preferredThisArg(target, thisArg, thisProxyTarget) {
		const {name} = target;
		const isHandledMethod = SmartClone.isHandledMethod(thisProxyTarget, name);

		return this._stack[this._stack.length - 1]
			.preferredThisArg(isHandledMethod, name, thisArg, thisProxyTarget);
	}

	isChanged(isMutable, value, equals) {
		return this._stack[this._stack.length - 1].isChanged(isMutable, value, equals);
	}

	undo(object) {
		if (this._previousClone !== undefined) {
			this._previousClone.undo(object);
		}
	}

	stop() {
		this._previousClone = this._stack.pop();

		return this._previousClone.clone;
	}
}

/* eslint-disable unicorn/prefer-spread */

const defaultOptions = {
	equals: Object.is,
	isShallow: false,
	pathAsArray: false,
	ignoreSymbols: false,
	ignoreUnderscores: false,
	ignoreDetached: false,
	details: false,
};

const onChange$1 = (object, onChange, options = {}) => {
	options = {
		...defaultOptions,
		...options,
	};

	const proxyTarget = Symbol('ProxyTarget');
	const {equals, isShallow, ignoreDetached, details} = options;
	const cache = new Cache(equals);
	const hasOnValidate = typeof options.onValidate === 'function';
	const smartClone = new SmartClone(hasOnValidate);

	// eslint-disable-next-line max-params
	const validate = (target, property, value, previous, applyData) => !hasOnValidate
		|| smartClone.isCloning
		|| options.onValidate(path.concat(cache.getPath(target), property), value, previous, applyData) === true;

	const handleChangeOnTarget = (target, property, value, previous) => {
		if (
			!ignoreProperty(cache, options, property)
			&& !(ignoreDetached && cache.isDetached(target, object))
		) {
			handleChange(cache.getPath(target), property, value, previous);
		}
	};

	// eslint-disable-next-line max-params
	const handleChange = (changePath, property, value, previous, applyData) => {
		if (smartClone.isCloning) {
			smartClone.update(changePath, property, previous);
		} else {
			onChange(path.concat(changePath, property), value, previous, applyData);
		}
	};

	const getProxyTarget = value => value
		? (value[proxyTarget] || value)
		: value;

	const prepareValue = (value, target, property, basePath) => {
		if (
			isBuiltinWithoutMutableMethods(value)
			|| property === 'constructor'
			|| (isShallow && !SmartClone.isHandledMethod(target, property))
			|| ignoreProperty(cache, options, property)
			|| cache.isGetInvariant(target, property)
			|| (ignoreDetached && cache.isDetached(target, object))
		) {
			return value;
		}

		if (basePath === undefined) {
			basePath = cache.getPath(target);
		}

		return cache.getProxy(value, path.concat(basePath, property), handler, proxyTarget);
	};

	const handler = {
		get(target, property, receiver) {
			if (isSymbol(property)) {
				if (property === proxyTarget || property === TARGET) {
					return target;
				}

				if (
					property === UNSUBSCRIBE
					&& !cache.isUnsubscribed
					&& cache.getPath(target).length === 0
				) {
					cache.unsubscribe();
					return target;
				}
			}

			const value = isBuiltinWithMutableMethods(target)
				? Reflect.get(target, property)
				: Reflect.get(target, property, receiver);

			return prepareValue(value, target, property);
		},

		set(target, property, value, receiver) {
			value = getProxyTarget(value);

			const reflectTarget = target[proxyTarget] || target;
			const previous = reflectTarget[property];

			if (equals(previous, value) && property in target) {
				return true;
			}

			const isValid = validate(target, property, value, previous);

			if (
				isValid
				&& cache.setProperty(reflectTarget, property, value, receiver, previous)
			) {
				handleChangeOnTarget(target, property, target[property], previous);

				return true;
			}

			return !isValid;
		},

		defineProperty(target, property, descriptor) {
			if (!cache.isSameDescriptor(descriptor, target, property)) {
				const previous = target[property];

				if (
					validate(target, property, descriptor.value, previous)
					&& cache.defineProperty(target, property, descriptor, previous)
				) {
					handleChangeOnTarget(target, property, descriptor.value, previous);
				}
			}

			return true;
		},

		deleteProperty(target, property) {
			if (!Reflect.has(target, property)) {
				return true;
			}

			const previous = Reflect.get(target, property);
			const isValid = validate(target, property, undefined, previous);

			if (
				isValid
				&& cache.deleteProperty(target, property, previous)
			) {
				handleChangeOnTarget(target, property, undefined, previous);

				return true;
			}

			return !isValid;
		},

		apply(target, thisArg, argumentsList) {
			const thisProxyTarget = thisArg[proxyTarget] || thisArg;

			if (cache.isUnsubscribed) {
				return Reflect.apply(target, thisProxyTarget, argumentsList);
			}

			if (
				(details === false
					|| (details !== true && !details.includes(target.name)))
				&& SmartClone.isHandledType(thisProxyTarget)
			) {
				let applyPath = path.initial(cache.getPath(target));
				const isHandledMethod = SmartClone.isHandledMethod(thisProxyTarget, target.name);

				smartClone.start(thisProxyTarget, applyPath, argumentsList);

				let result = Reflect.apply(
					target,
					smartClone.preferredThisArg(target, thisArg, thisProxyTarget),
					isHandledMethod
						? argumentsList.map(argument => getProxyTarget(argument))
						: argumentsList,
				);

				const isChanged = smartClone.isChanged(thisProxyTarget, equals);
				const previous = smartClone.stop();

				if (SmartClone.isHandledType(result) && isHandledMethod) {
					if (thisArg instanceof Map && target.name === 'get') {
						applyPath = path.concat(applyPath, argumentsList[0]);
					}

					result = cache.getProxy(result, applyPath, handler);
				}

				if (isChanged) {
					const applyData = {
						name: target.name,
						args: argumentsList,
						result,
					};
					const changePath = smartClone.isCloning
						? path.initial(applyPath)
						: applyPath;
					const property = smartClone.isCloning
						? path.last(applyPath)
						: '';

					if (validate(path.get(object, changePath), property, thisProxyTarget, previous, applyData)) {
						handleChange(changePath, property, thisProxyTarget, previous, applyData);
					} else {
						smartClone.undo(thisProxyTarget);
					}
				}

				if (
					(thisArg instanceof Map || thisArg instanceof Set)
					&& isIterator(result)
				) {
					return wrapIterator(result, target, thisArg, applyPath, prepareValue);
				}

				return result;
			}

			return Reflect.apply(target, thisArg, argumentsList);
		},
	};

	const proxy = cache.getProxy(object, options.pathAsArray ? [] : '', handler);
	onChange = onChange.bind(proxy);

	if (hasOnValidate) {
		options.onValidate = options.onValidate.bind(proxy);
	}

	return proxy;
};

onChange$1.target = proxy => (proxy && proxy[TARGET]) || proxy;
onChange$1.unsubscribe = proxy => proxy[UNSUBSCRIBE] || proxy;

var cjs = onChange$1;

var rfc6902 = {};

var pointer = {};

Object.defineProperty(pointer, "__esModule", { value: true });
pointer.Pointer = void 0;
/**
Unescape token part of a JSON Pointer string

`token` should *not* contain any '/' characters.

> Evaluation of each reference token begins by decoding any escaped
> character sequence.  This is performed by first transforming any
> occurrence of the sequence '~1' to '/', and then transforming any
> occurrence of the sequence '~0' to '~'.  By performing the
> substitutions in this order, an implementation avoids the error of
> turning '~01' first into '~1' and then into '/', which would be
> incorrect (the string '~01' correctly becomes '~1' after
> transformation).

Here's my take:

~1 is unescaped with higher priority than ~0 because it is a lower-order escape character.
I say "lower order" because '/' needs escaping due to the JSON Pointer serialization technique.
Whereas, '~' is escaped because escaping '/' uses the '~' character.
*/
function unescape$1(token) {
    return token.replace(/~1/g, '/').replace(/~0/g, '~');
}
/** Escape token part of a JSON Pointer string

> '~' needs to be encoded as '~0' and '/'
> needs to be encoded as '~1' when these characters appear in a
> reference token.

This is the exact inverse of `unescape()`, so the reverse replacements must take place in reverse order.
*/
function escape(token) {
    return token.replace(/~/g, '~0').replace(/\//g, '~1');
}
/**
JSON Pointer representation
*/
var Pointer = /** @class */ (function () {
    function Pointer(tokens) {
        if (tokens === void 0) { tokens = ['']; }
        this.tokens = tokens;
    }
    /**
    `path` *must* be a properly escaped string.
    */
    Pointer.fromJSON = function (path) {
        var tokens = path.split('/').map(unescape$1);
        if (tokens[0] !== '')
            throw new Error("Invalid JSON Pointer: " + path);
        return new Pointer(tokens);
    };
    Pointer.prototype.toString = function () {
        return this.tokens.map(escape).join('/');
    };
    /**
    Returns an object with 'parent', 'key', and 'value' properties.
    In the special case that this Pointer's path == "",
    this object will be {parent: null, key: '', value: object}.
    Otherwise, parent and key will have the property such that parent[key] == value.
    */
    Pointer.prototype.evaluate = function (object) {
        var parent = null;
        var key = '';
        var value = object;
        for (var i = 1, l = this.tokens.length; i < l; i++) {
            parent = value;
            key = this.tokens[i];
            // not sure if this the best way to handle non-existant paths...
            value = (parent || {})[key];
        }
        return { parent: parent, key: key, value: value };
    };
    Pointer.prototype.get = function (object) {
        return this.evaluate(object).value;
    };
    Pointer.prototype.set = function (object, value) {
        var cursor = object;
        for (var i = 1, l = this.tokens.length - 1, token = this.tokens[i]; i < l; i++) {
            // not sure if this the best way to handle non-existant paths...
            cursor = (cursor || {})[token];
        }
        if (cursor) {
            cursor[this.tokens[this.tokens.length - 1]] = value;
        }
    };
    Pointer.prototype.push = function (token) {
        // mutable
        this.tokens.push(token);
    };
    /**
    `token` should be a String. It'll be coerced to one anyway.
  
    immutable (shallowly)
    */
    Pointer.prototype.add = function (token) {
        var tokens = this.tokens.concat(String(token));
        return new Pointer(tokens);
    };
    return Pointer;
}());
pointer.Pointer = Pointer;

var patch = {};

var util = {};

(function (exports) {
Object.defineProperty(exports, "__esModule", { value: true });
exports.clone = exports.objectType = exports.hasOwnProperty = void 0;
exports.hasOwnProperty = Object.prototype.hasOwnProperty;
function objectType(object) {
    if (object === undefined) {
        return 'undefined';
    }
    if (object === null) {
        return 'null';
    }
    if (Array.isArray(object)) {
        return 'array';
    }
    return typeof object;
}
exports.objectType = objectType;
/**
Recursively copy a value.

@param source - should be a JavaScript primitive, Array, or (plain old) Object.
@returns copy of source where every Array and Object have been recursively
         reconstructed from their constituent elements
*/
function clone(source) {
    // loose-equality checking for null is faster than strict checking for each of null/undefined/true/false
    // checking null first, then calling typeof, is faster than vice-versa
    if (source == null || typeof source != 'object') {
        // short-circuiting is faster than a single return
        return source;
    }
    // x.constructor == Array is the fastest way to check if x is an Array
    if (source.constructor == Array) {
        // construction via imperative for-loop is faster than source.map(arrayVsObject)
        var length_1 = source.length;
        // setting the Array length during construction is faster than just `[]` or `new Array()`
        var arrayTarget = new Array(length_1);
        for (var i = 0; i < length_1; i++) {
            arrayTarget[i] = clone(source[i]);
        }
        return arrayTarget;
    }
    // Object
    var objectTarget = {};
    // declaring the variable (with const) inside the loop is faster
    for (var key in source) {
        // hasOwnProperty costs a bit of performance, but it's semantically necessary
        // using a global helper is MUCH faster than calling source.hasOwnProperty(key)
        if (exports.hasOwnProperty.call(source, key)) {
            objectTarget[key] = clone(source[key]);
        }
    }
    return objectTarget;
}
exports.clone = clone;
}(util));

var equal = {};

Object.defineProperty(equal, "__esModule", { value: true });
equal.compare = void 0;
var util_1$2 = util;
/**
Evaluate `left === right`, treating `left` and `right` as ordered lists.

@returns true iff `left` and `right` have identical lengths, and every element
         of `left` is equal to the corresponding element of `right`. Equality is
         determined recursivly, via `compare`.
*/
function compareArrays(left, right) {
    var length = left.length;
    if (length !== right.length) {
        return false;
    }
    for (var i = 0; i < length; i++) {
        if (!compare(left[i], right[i])) {
            return false;
        }
    }
    return true;
}
/**
Evaluate `left === right`, treating `left` and `right` as property maps.

@returns true iff every property in `left` has a value equal to the value of the
         corresponding property in `right`, and vice-versa, stopping as soon as
         possible. Equality is determined recursivly, via `compare`.
*/
function compareObjects(left, right) {
    var left_keys = Object.keys(left);
    var right_keys = Object.keys(right);
    var length = left_keys.length;
    // quick exit if the number of keys don't match up
    if (length !== right_keys.length) {
        return false;
    }
    // we don't know for sure that Set(left_keys) is equal to Set(right_keys),
    // much less that their values in left and right are equal, but if right
    // contains each key in left, we know it can't have any additional keys
    for (var i = 0; i < length; i++) {
        var key = left_keys[i];
        if (!util_1$2.hasOwnProperty.call(right, key) || !compare(left[key], right[key])) {
            return false;
        }
    }
    return true;
}
/**
`compare()` returns true if `left` and `right` are materially equal
(i.e., would produce equivalent JSON), false otherwise.

> Here, "equal" means that the value at the target location and the
> value conveyed by "value" are of the same JSON type, and that they
> are considered equal by the following rules for that type:
> o  strings: are considered equal if they contain the same number of
>    Unicode characters and their code points are byte-by-byte equal.
> o  numbers: are considered equal if their values are numerically
>    equal.
> o  arrays: are considered equal if they contain the same number of
>    values, and if each value can be considered equal to the value at
>    the corresponding position in the other array, using this list of
>    type-specific rules.
> o  objects: are considered equal if they contain the same number of
>    members, and if each member can be considered equal to a member in
>    the other object, by comparing their keys (as strings) and their
>    values (using this list of type-specific rules).
> o  literals (false, true, and null): are considered equal if they are
>    the same.
*/
function compare(left, right) {
    // strict equality handles literals, numbers, and strings (a sufficient but not necessary cause)
    if (left === right) {
        return true;
    }
    var left_type = util_1$2.objectType(left);
    var right_type = util_1$2.objectType(right);
    // check arrays
    if (left_type == 'array' && right_type == 'array') {
        return compareArrays(left, right);
    }
    // check objects
    if (left_type == 'object' && right_type == 'object') {
        return compareObjects(left, right);
    }
    // mismatched arrays & objects, etc., are always inequal
    return false;
}
equal.compare = compare;

var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(patch, "__esModule", { value: true });
patch.apply = patch.InvalidOperationError = patch.test = patch.copy = patch.move = patch.replace = patch.remove = patch.add = patch.TestError = patch.MissingError = void 0;
var pointer_1$1 = pointer;
var util_1$1 = util;
var equal_1$1 = equal;
var MissingError = /** @class */ (function (_super) {
    __extends(MissingError, _super);
    function MissingError(path) {
        var _this = _super.call(this, "Value required at path: " + path) || this;
        _this.path = path;
        _this.name = 'MissingError';
        return _this;
    }
    return MissingError;
}(Error));
patch.MissingError = MissingError;
var TestError = /** @class */ (function (_super) {
    __extends(TestError, _super);
    function TestError(actual, expected) {
        var _this = _super.call(this, "Test failed: " + actual + " != " + expected) || this;
        _this.actual = actual;
        _this.expected = expected;
        _this.name = 'TestError';
        return _this;
    }
    return TestError;
}(Error));
patch.TestError = TestError;
function _add(object, key, value) {
    if (Array.isArray(object)) {
        // `key` must be an index
        if (key == '-') {
            object.push(value);
        }
        else {
            var index = parseInt(key, 10);
            object.splice(index, 0, value);
        }
    }
    else {
        object[key] = value;
    }
}
function _remove(object, key) {
    if (Array.isArray(object)) {
        // '-' syntax doesn't make sense when removing
        var index = parseInt(key, 10);
        object.splice(index, 1);
    }
    else {
        // not sure what the proper behavior is when path = ''
        delete object[key];
    }
}
/**
>  o  If the target location specifies an array index, a new value is
>     inserted into the array at the specified index.
>  o  If the target location specifies an object member that does not
>     already exist, a new member is added to the object.
>  o  If the target location specifies an object member that does exist,
>     that member's value is replaced.
*/
function add(object, operation) {
    var endpoint = pointer_1$1.Pointer.fromJSON(operation.path).evaluate(object);
    // it's not exactly a "MissingError" in the same way that `remove` is -- more like a MissingParent, or something
    if (endpoint.parent === undefined) {
        return new MissingError(operation.path);
    }
    _add(endpoint.parent, endpoint.key, util_1$1.clone(operation.value));
    return null;
}
patch.add = add;
/**
> The "remove" operation removes the value at the target location.
> The target location MUST exist for the operation to be successful.
*/
function remove(object, operation) {
    // endpoint has parent, key, and value properties
    var endpoint = pointer_1$1.Pointer.fromJSON(operation.path).evaluate(object);
    if (endpoint.value === undefined) {
        return new MissingError(operation.path);
    }
    // not sure what the proper behavior is when path = ''
    _remove(endpoint.parent, endpoint.key);
    return null;
}
patch.remove = remove;
/**
> The "replace" operation replaces the value at the target location
> with a new value.  The operation object MUST contain a "value" member
> whose content specifies the replacement value.
> The target location MUST exist for the operation to be successful.

> This operation is functionally identical to a "remove" operation for
> a value, followed immediately by an "add" operation at the same
> location with the replacement value.

Even more simply, it's like the add operation with an existence check.
*/
function replace(object, operation) {
    var endpoint = pointer_1$1.Pointer.fromJSON(operation.path).evaluate(object);
    if (endpoint.parent === null) {
        return new MissingError(operation.path);
    }
    // this existence check treats arrays as a special case
    if (Array.isArray(endpoint.parent)) {
        if (parseInt(endpoint.key, 10) >= endpoint.parent.length) {
            return new MissingError(operation.path);
        }
    }
    else if (endpoint.value === undefined) {
        return new MissingError(operation.path);
    }
    endpoint.parent[endpoint.key] = operation.value;
    return null;
}
patch.replace = replace;
/**
> The "move" operation removes the value at a specified location and
> adds it to the target location.
> The operation object MUST contain a "from" member, which is a string
> containing a JSON Pointer value that references the location in the
> target document to move the value from.
> This operation is functionally identical to a "remove" operation on
> the "from" location, followed immediately by an "add" operation at
> the target location with the value that was just removed.

> The "from" location MUST NOT be a proper prefix of the "path"
> location; i.e., a location cannot be moved into one of its children.

TODO: throw if the check described in the previous paragraph fails.
*/
function move(object, operation) {
    var from_endpoint = pointer_1$1.Pointer.fromJSON(operation.from).evaluate(object);
    if (from_endpoint.value === undefined) {
        return new MissingError(operation.from);
    }
    var endpoint = pointer_1$1.Pointer.fromJSON(operation.path).evaluate(object);
    if (endpoint.parent === undefined) {
        return new MissingError(operation.path);
    }
    _remove(from_endpoint.parent, from_endpoint.key);
    _add(endpoint.parent, endpoint.key, from_endpoint.value);
    return null;
}
patch.move = move;
/**
> The "copy" operation copies the value at a specified location to the
> target location.
> The operation object MUST contain a "from" member, which is a string
> containing a JSON Pointer value that references the location in the
> target document to copy the value from.
> The "from" location MUST exist for the operation to be successful.

> This operation is functionally identical to an "add" operation at the
> target location using the value specified in the "from" member.

Alternatively, it's like 'move' without the 'remove'.
*/
function copy(object, operation) {
    var from_endpoint = pointer_1$1.Pointer.fromJSON(operation.from).evaluate(object);
    if (from_endpoint.value === undefined) {
        return new MissingError(operation.from);
    }
    var endpoint = pointer_1$1.Pointer.fromJSON(operation.path).evaluate(object);
    if (endpoint.parent === undefined) {
        return new MissingError(operation.path);
    }
    _add(endpoint.parent, endpoint.key, util_1$1.clone(from_endpoint.value));
    return null;
}
patch.copy = copy;
/**
> The "test" operation tests that a value at the target location is
> equal to a specified value.
> The operation object MUST contain a "value" member that conveys the
> value to be compared to the target location's value.
> The target location MUST be equal to the "value" value for the
> operation to be considered successful.
*/
function test(object, operation) {
    var endpoint = pointer_1$1.Pointer.fromJSON(operation.path).evaluate(object);
    var result = equal_1$1.compare(endpoint.value, operation.value);
    if (!result) {
        return new TestError(endpoint.value, operation.value);
    }
    return null;
}
patch.test = test;
var InvalidOperationError = /** @class */ (function (_super) {
    __extends(InvalidOperationError, _super);
    function InvalidOperationError(operation) {
        var _this = _super.call(this, "Invalid operation: " + operation.op) || this;
        _this.operation = operation;
        _this.name = 'InvalidOperationError';
        return _this;
    }
    return InvalidOperationError;
}(Error));
patch.InvalidOperationError = InvalidOperationError;
/**
Switch on `operation.op`, applying the corresponding patch function for each
case to `object`.
*/
function apply(object, operation) {
    // not sure why TypeScript can't infer typesafety of:
    //   {add, remove, replace, move, copy, test}[operation.op](object, operation)
    // (seems like a bug)
    switch (operation.op) {
        case 'add': return add(object, operation);
        case 'remove': return remove(object, operation);
        case 'replace': return replace(object, operation);
        case 'move': return move(object, operation);
        case 'copy': return copy(object, operation);
        case 'test': return test(object, operation);
    }
    return new InvalidOperationError(operation);
}
patch.apply = apply;

var diff = {};

Object.defineProperty(diff, "__esModule", { value: true });
diff.diffAny = diff.diffObjects = diff.diffArrays = diff.intersection = diff.subtract = diff.isDestructive = void 0;
var equal_1 = equal;
var util_1 = util;
function isDestructive(_a) {
    var op = _a.op;
    return op === 'remove' || op === 'replace' || op === 'copy' || op === 'move';
}
diff.isDestructive = isDestructive;
/**
List the keys in `minuend` that are not in `subtrahend`.

A key is only considered if it is both 1) an own-property (o.hasOwnProperty(k))
of the object, and 2) has a value that is not undefined. This is to match JSON
semantics, where JSON object serialization drops keys with undefined values.

@param minuend Object of interest
@param subtrahend Object of comparison
@returns Array of keys that are in `minuend` but not in `subtrahend`.
*/
function subtract(minuend, subtrahend) {
    // initialize empty object; we only care about the keys, the values can be anything
    var obj = {};
    // build up obj with all the properties of minuend
    for (var add_key in minuend) {
        if (util_1.hasOwnProperty.call(minuend, add_key) && minuend[add_key] !== undefined) {
            obj[add_key] = 1;
        }
    }
    // now delete all the properties of subtrahend from obj
    // (deleting a missing key has no effect)
    for (var del_key in subtrahend) {
        if (util_1.hasOwnProperty.call(subtrahend, del_key) && subtrahend[del_key] !== undefined) {
            delete obj[del_key];
        }
    }
    // finally, extract whatever keys remain in obj
    return Object.keys(obj);
}
diff.subtract = subtract;
/**
List the keys that shared by all `objects`.

The semantics of what constitutes a "key" is described in {@link subtract}.

@param objects Array of objects to compare
@returns Array of keys that are in ("own-properties" of) every object in `objects`.
*/
function intersection(objects) {
    var length = objects.length;
    // prepare empty counter to keep track of how many objects each key occurred in
    var counter = {};
    // go through each object and increment the counter for each key in that object
    for (var i = 0; i < length; i++) {
        var object = objects[i];
        for (var key in object) {
            if (util_1.hasOwnProperty.call(object, key) && object[key] !== undefined) {
                counter[key] = (counter[key] || 0) + 1;
            }
        }
    }
    // now delete all keys from the counter that were not seen in every object
    for (var key in counter) {
        if (counter[key] < length) {
            delete counter[key];
        }
    }
    // finally, extract whatever keys remain in the counter
    return Object.keys(counter);
}
diff.intersection = intersection;
function isArrayAdd(array_operation) {
    return array_operation.op === 'add';
}
function isArrayRemove(array_operation) {
    return array_operation.op === 'remove';
}
function appendArrayOperation(base, operation) {
    return {
        // the new operation must be pushed on the end
        operations: base.operations.concat(operation),
        cost: base.cost + 1,
    };
}
/**
Calculate the shortest sequence of operations to get from `input` to `output`,
using a dynamic programming implementation of the Levenshtein distance algorithm.

To get from the input ABC to the output AZ we could just delete all the input
and say "insert A, insert Z" and be done with it. That's what we do if the
input is empty. But we can be smarter.

          output
               A   Z
               -   -
          [0]  1   2
input A |  1  [0]  1
      B |  2  [1]  1
      C |  3   2  [2]

1) start at 0,0 (+0)
2) keep A (+0)
3) remove B (+1)
4) replace C with Z (+1)

If the `input` (source) is empty, they'll all be in the top row, resulting in an
array of 'add' operations.
If the `output` (target) is empty, everything will be in the left column,
resulting in an array of 'remove' operations.

@returns A list of add/remove/replace operations.
*/
function diffArrays(input, output, ptr, diff) {
    if (diff === void 0) { diff = diffAny; }
    // set up cost matrix (very simple initialization: just a map)
    var memo = {
        '0,0': { operations: [], cost: 0 },
    };
    /**
    Calculate the cheapest sequence of operations required to get from
    input.slice(0, i) to output.slice(0, j).
    There may be other valid sequences with the same cost, but none cheaper.
  
    @param i The row in the layout above
    @param j The column in the layout above
    @returns An object containing a list of operations, along with the total cost
             of applying them (+1 for each add/remove/replace operation)
    */
    function dist(i, j) {
        // memoized
        var memo_key = i + "," + j;
        var memoized = memo[memo_key];
        if (memoized === undefined) {
            if (i > 0 && j > 0 && equal_1.compare(input[i - 1], output[j - 1])) {
                // equal (no operations => no cost)
                memoized = dist(i - 1, j - 1);
            }
            else {
                var alternatives = [];
                if (i > 0) {
                    // NOT topmost row
                    var remove_base = dist(i - 1, j);
                    var remove_operation = {
                        op: 'remove',
                        index: i - 1,
                    };
                    alternatives.push(appendArrayOperation(remove_base, remove_operation));
                }
                if (j > 0) {
                    // NOT leftmost column
                    var add_base = dist(i, j - 1);
                    var add_operation = {
                        op: 'add',
                        index: i - 1,
                        value: output[j - 1],
                    };
                    alternatives.push(appendArrayOperation(add_base, add_operation));
                }
                if (i > 0 && j > 0) {
                    // TABLE MIDDLE
                    // supposing we replaced it, compute the rest of the costs:
                    var replace_base = dist(i - 1, j - 1);
                    // okay, the general plan is to replace it, but we can be smarter,
                    // recursing into the structure and replacing only part of it if
                    // possible, but to do so we'll need the original value
                    var replace_operation = {
                        op: 'replace',
                        index: i - 1,
                        original: input[i - 1],
                        value: output[j - 1],
                    };
                    alternatives.push(appendArrayOperation(replace_base, replace_operation));
                }
                // the only other case, i === 0 && j === 0, has already been memoized
                // the meat of the algorithm:
                // sort by cost to find the lowest one (might be several ties for lowest)
                // [4, 6, 7, 1, 2].sort((a, b) => a - b) -> [ 1, 2, 4, 6, 7 ]
                var best = alternatives.sort(function (a, b) { return a.cost - b.cost; })[0];
                memoized = best;
            }
            memo[memo_key] = memoized;
        }
        return memoized;
    }
    // handle weird objects masquerading as Arrays that don't have proper length
    // properties by using 0 for everything but positive numbers
    var input_length = (isNaN(input.length) || input.length <= 0) ? 0 : input.length;
    var output_length = (isNaN(output.length) || output.length <= 0) ? 0 : output.length;
    var array_operations = dist(input_length, output_length).operations;
    var padded_operations = array_operations.reduce(function (_a, array_operation) {
        var operations = _a[0], padding = _a[1];
        if (isArrayAdd(array_operation)) {
            var padded_index = array_operation.index + 1 + padding;
            var index_token = padded_index < (input_length + padding) ? String(padded_index) : '-';
            var operation = {
                op: array_operation.op,
                path: ptr.add(index_token).toString(),
                value: array_operation.value,
            };
            // padding++ // maybe only if array_operation.index > -1 ?
            return [operations.concat(operation), padding + 1];
        }
        else if (isArrayRemove(array_operation)) {
            var operation = {
                op: array_operation.op,
                path: ptr.add(String(array_operation.index + padding)).toString(),
            };
            // padding--
            return [operations.concat(operation), padding - 1];
        }
        else { // replace
            var replace_ptr = ptr.add(String(array_operation.index + padding));
            var replace_operations = diff(array_operation.original, array_operation.value, replace_ptr);
            return [operations.concat.apply(operations, replace_operations), padding];
        }
    }, [[], 0])[0];
    return padded_operations;
}
diff.diffArrays = diffArrays;
function diffObjects(input, output, ptr, diff) {
    if (diff === void 0) { diff = diffAny; }
    // if a key is in input but not output -> remove it
    var operations = [];
    subtract(input, output).forEach(function (key) {
        operations.push({ op: 'remove', path: ptr.add(key).toString() });
    });
    // if a key is in output but not input -> add it
    subtract(output, input).forEach(function (key) {
        operations.push({ op: 'add', path: ptr.add(key).toString(), value: output[key] });
    });
    // if a key is in both, diff it recursively
    intersection([input, output]).forEach(function (key) {
        operations.push.apply(operations, diff(input[key], output[key], ptr.add(key)));
    });
    return operations;
}
diff.diffObjects = diffObjects;
/**
`diffAny()` returns an empty array if `input` and `output` are materially equal
(i.e., would produce equivalent JSON); otherwise it produces an array of patches
that would transform `input` into `output`.
*/
function diffAny(input, output, ptr, diff) {
    if (diff === void 0) { diff = diffAny; }
    // strict equality handles literals, numbers, and strings (a sufficient but not necessary cause)
    if (input === output) {
        return [];
    }
    var input_type = util_1.objectType(input);
    var output_type = util_1.objectType(output);
    if (input_type == 'array' && output_type == 'array') {
        return diffArrays(input, output, ptr, diff);
    }
    if (input_type == 'object' && output_type == 'object') {
        return diffObjects(input, output, ptr, diff);
    }
    // at this point we know that input and output are materially different;
    // could be array -> object, object -> array, boolean -> undefined,
    // number -> string, or some other combination, but nothing that can be split
    // up into multiple patches: so `output` must replace `input` wholesale.
    return [{ op: 'replace', path: ptr.toString(), value: output }];
}
diff.diffAny = diffAny;

Object.defineProperty(rfc6902, "__esModule", { value: true });
rfc6902.createTests = rfc6902.createPatch = rfc6902.applyPatch = void 0;
var pointer_1 = pointer;
var patch_1 = patch;
var diff_1 = diff;
/**
Apply a 'application/json-patch+json'-type patch to an object.

`patch` *must* be an array of operations.

> Operation objects MUST have exactly one "op" member, whose value
> indicates the operation to perform.  Its value MUST be one of "add",
> "remove", "replace", "move", "copy", or "test"; other values are
> errors.

This method mutates the target object in-place.

@returns list of results, one for each operation: `null` indicated success,
         otherwise, the result will be an instance of one of the Error classes:
         MissingError, InvalidOperationError, or TestError.
*/
function applyPatch(object, patch) {
    return patch.map(function (operation) { return patch_1.apply(object, operation); });
}
rfc6902.applyPatch = applyPatch;
function wrapVoidableDiff(diff) {
    function wrappedDiff(input, output, ptr) {
        var custom_patch = diff(input, output, ptr);
        // ensure an array is always returned
        return Array.isArray(custom_patch) ? custom_patch : diff_1.diffAny(input, output, ptr, wrappedDiff);
    }
    return wrappedDiff;
}
/**
Produce a 'application/json-patch+json'-type patch to get from one object to
another.

This does not alter `input` or `output` unless they have a property getter with
side-effects (which is not a good idea anyway).

`diff` is called on each pair of comparable non-primitive nodes in the
`input`/`output` object trees, producing nested patches. Return `undefined`
to fall back to default behaviour.

Returns list of operations to perform on `input` to produce `output`.
*/
function createPatch$2(input, output, diff) {
    var ptr = new pointer_1.Pointer();
    // a new Pointer gets a default path of [''] if not specified
    return (diff ? wrapVoidableDiff(diff) : diff_1.diffAny)(input, output, ptr);
}
rfc6902.createPatch = createPatch$2;
/**
Create a test operation based on `input`'s current evaluation of the JSON
Pointer `path`; if such a pointer cannot be resolved, returns undefined.
*/
function createTest(input, path) {
    var endpoint = pointer_1.Pointer.fromJSON(path).evaluate(input);
    if (endpoint !== undefined) {
        return { op: 'test', path: path, value: endpoint.value };
    }
}
/**
Produce an 'application/json-patch+json'-type list of tests, to verify that
existing values in an object are identical to the those captured at some
checkpoint (whenever this function is called).

This does not alter `input` or `output` unless they have a property getter with
side-effects (which is not a good idea anyway).

Returns list of test operations.
*/
function createTests(input, patch) {
    var tests = new Array();
    patch.filter(diff_1.isDestructive).forEach(function (operation) {
        var pathTest = createTest(input, operation.path);
        if (pathTest)
            tests.push(pathTest);
        if ('from' in operation) {
            var fromTest = createTest(input, operation.from);
            if (fromTest)
                tests.push(fromTest);
        }
    });
    return tests;
}
rfc6902.createTests = createTests;

function dateToIsoString$2(date) {
	let tzo = -date.getTimezoneOffset();
	let dif = tzo >= 0 ? '+' : '-';

	function pad(num) {
		let norm = Math.floor(Math.abs(num));
		return (norm < 10 ? '0' : '') + norm;
	}

	function padMilli(d) {
		return (d.getMilliseconds() + '').padStart(3, '0');
	}

	return date.getFullYear() +
		'-' + pad(date.getMonth() + 1) +
		'-' + pad(date.getDate()) +
		'T' + pad(date.getHours()) +
		':' + pad(date.getMinutes()) +
		':' + pad(date.getSeconds()) +
		'.' + padMilli(date) +
		dif + pad(tzo / 60) +
		':' + pad(tzo % 60);
}

var dateToIsoString_1 = dateToIsoString$2;

let isStringifying = false;
let dateToIsoString$1 = dateToIsoString_1;

let dateToJSON = Date.prototype.toJSON;
Date.prototype.toJSON = function() {
	if (isStringifying)
		return dateToIsoString$1(this);
	return dateToJSON.apply(this);
};

function stringify$3(value) {
	isStringifying = true;
	let result = JSON.stringify(value);
	isStringifying = false;
	return result;
}

var stringify_1 = stringify$3;

// Unique ID creation requires a high quality random # generator. In the browser we therefore
// require the crypto API and do not support built-in fallback to lower quality random number
// generators (like Math.random()).
var getRandomValues;
var rnds8 = new Uint8Array(16);
function rng() {
  // lazy load so that environments that need to polyfill have a chance to do so
  if (!getRandomValues) {
    // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation. Also,
    // find the complete implementation of crypto (msCrypto) on IE11.
    getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto !== 'undefined' && typeof msCrypto.getRandomValues === 'function' && msCrypto.getRandomValues.bind(msCrypto);

    if (!getRandomValues) {
      throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
    }
  }

  return getRandomValues(rnds8);
}

var REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

function validate(uuid) {
  return typeof uuid === 'string' && REGEX.test(uuid);
}

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */

var byteToHex = [];

for (var i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).substr(1));
}

function stringify$2(arr) {
  var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  // Note: Be careful editing this code!  It's been tuned for performance
  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
  var uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase(); // Consistency check for valid UUID.  If this throws, it's likely due to one
  // of the following:
  // - One or more input array values don't map to a hex octet (leading to
  // "undefined" in the uuid)
  // - Invalid input values for the RFC `version` or `variant` fields

  if (!validate(uuid)) {
    throw TypeError('Stringified UUID is invalid');
  }

  return uuid;
}

//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html

var _nodeId;

var _clockseq; // Previous uuid creation time


var _lastMSecs = 0;
var _lastNSecs = 0; // See https://github.com/uuidjs/uuid for API details

function v1(options, buf, offset) {
  var i = buf && offset || 0;
  var b = buf || new Array(16);
  options = options || {};
  var node = options.node || _nodeId;
  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq; // node and clockseq need to be initialized to random values if they're not
  // specified.  We do this lazily to minimize issues related to insufficient
  // system entropy.  See #189

  if (node == null || clockseq == null) {
    var seedBytes = options.random || (options.rng || rng)();

    if (node == null) {
      // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
      node = _nodeId = [seedBytes[0] | 0x01, seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]];
    }

    if (clockseq == null) {
      // Per 4.2.2, randomize (14 bit) clockseq
      clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 0x3fff;
    }
  } // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.


  var msecs = options.msecs !== undefined ? options.msecs : Date.now(); // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock

  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1; // Time since last uuid creation (in msecs)

  var dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 10000; // Per 4.2.1.2, Bump clockseq on clock regression

  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  } // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval


  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  } // Per 4.2.1.2 Throw error if too many uuids are requested


  if (nsecs >= 10000) {
    throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq; // Per 4.1.4 - Convert from unix epoch to Gregorian epoch

  msecs += 12219292800000; // `time_low`

  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff; // `time_mid`

  var tmh = msecs / 0x100000000 * 10000 & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff; // `time_high_and_version`

  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version

  b[i++] = tmh >>> 16 & 0xff; // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)

  b[i++] = clockseq >>> 8 | 0x80; // `clock_seq_low`

  b[i++] = clockseq & 0xff; // `node`

  for (var n = 0; n < 6; ++n) {
    b[i + n] = node[n];
  }

  return buf || stringify$2(b);
}

function parse(uuid) {
  if (!validate(uuid)) {
    throw TypeError('Invalid UUID');
  }

  var v;
  var arr = new Uint8Array(16); // Parse ########-....-....-....-............

  arr[0] = (v = parseInt(uuid.slice(0, 8), 16)) >>> 24;
  arr[1] = v >>> 16 & 0xff;
  arr[2] = v >>> 8 & 0xff;
  arr[3] = v & 0xff; // Parse ........-####-....-....-............

  arr[4] = (v = parseInt(uuid.slice(9, 13), 16)) >>> 8;
  arr[5] = v & 0xff; // Parse ........-....-####-....-............

  arr[6] = (v = parseInt(uuid.slice(14, 18), 16)) >>> 8;
  arr[7] = v & 0xff; // Parse ........-....-....-####-............

  arr[8] = (v = parseInt(uuid.slice(19, 23), 16)) >>> 8;
  arr[9] = v & 0xff; // Parse ........-....-....-....-############
  // (Use "/" to avoid 32-bit truncation when bit-shifting high-order bytes)

  arr[10] = (v = parseInt(uuid.slice(24, 36), 16)) / 0x10000000000 & 0xff;
  arr[11] = v / 0x100000000 & 0xff;
  arr[12] = v >>> 24 & 0xff;
  arr[13] = v >>> 16 & 0xff;
  arr[14] = v >>> 8 & 0xff;
  arr[15] = v & 0xff;
  return arr;
}

function stringToBytes(str) {
  str = unescape(encodeURIComponent(str)); // UTF8 escape

  var bytes = [];

  for (var i = 0; i < str.length; ++i) {
    bytes.push(str.charCodeAt(i));
  }

  return bytes;
}

var DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
var URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';
function v35 (name, version, hashfunc) {
  function generateUUID(value, namespace, buf, offset) {
    if (typeof value === 'string') {
      value = stringToBytes(value);
    }

    if (typeof namespace === 'string') {
      namespace = parse(namespace);
    }

    if (namespace.length !== 16) {
      throw TypeError('Namespace must be array-like (16 iterable integer values, 0-255)');
    } // Compute hash of namespace and value, Per 4.3
    // Future: Use spread syntax when supported on all platforms, e.g. `bytes =
    // hashfunc([...namespace, ... value])`


    var bytes = new Uint8Array(16 + value.length);
    bytes.set(namespace);
    bytes.set(value, namespace.length);
    bytes = hashfunc(bytes);
    bytes[6] = bytes[6] & 0x0f | version;
    bytes[8] = bytes[8] & 0x3f | 0x80;

    if (buf) {
      offset = offset || 0;

      for (var i = 0; i < 16; ++i) {
        buf[offset + i] = bytes[i];
      }

      return buf;
    }

    return stringify$2(bytes);
  } // Function#name is not settable on some platforms (#270)


  try {
    generateUUID.name = name; // eslint-disable-next-line no-empty
  } catch (err) {} // For CommonJS default export support


  generateUUID.DNS = DNS;
  generateUUID.URL = URL;
  return generateUUID;
}

/*
 * Browser-compatible JavaScript MD5
 *
 * Modification of JavaScript MD5
 * https://github.com/blueimp/JavaScript-MD5
 *
 * Copyright 2011, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * https://opensource.org/licenses/MIT
 *
 * Based on
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */
function md5(bytes) {
  if (typeof bytes === 'string') {
    var msg = unescape(encodeURIComponent(bytes)); // UTF8 escape

    bytes = new Uint8Array(msg.length);

    for (var i = 0; i < msg.length; ++i) {
      bytes[i] = msg.charCodeAt(i);
    }
  }

  return md5ToHexEncodedArray(wordsToMd5(bytesToWords(bytes), bytes.length * 8));
}
/*
 * Convert an array of little-endian words to an array of bytes
 */


function md5ToHexEncodedArray(input) {
  var output = [];
  var length32 = input.length * 32;
  var hexTab = '0123456789abcdef';

  for (var i = 0; i < length32; i += 8) {
    var x = input[i >> 5] >>> i % 32 & 0xff;
    var hex = parseInt(hexTab.charAt(x >>> 4 & 0x0f) + hexTab.charAt(x & 0x0f), 16);
    output.push(hex);
  }

  return output;
}
/**
 * Calculate output length with padding and bit length
 */


function getOutputLength(inputLength8) {
  return (inputLength8 + 64 >>> 9 << 4) + 14 + 1;
}
/*
 * Calculate the MD5 of an array of little-endian words, and a bit length.
 */


function wordsToMd5(x, len) {
  /* append padding */
  x[len >> 5] |= 0x80 << len % 32;
  x[getOutputLength(len) - 1] = len;
  var a = 1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d = 271733878;

  for (var i = 0; i < x.length; i += 16) {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;
    a = md5ff(a, b, c, d, x[i], 7, -680876936);
    d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
    c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
    b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
    a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
    d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
    c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
    b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
    a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
    d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
    c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
    b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
    a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
    d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
    c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
    b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
    a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
    d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
    c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
    b = md5gg(b, c, d, a, x[i], 20, -373897302);
    a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
    d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
    c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
    b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
    a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
    d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
    c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
    b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
    a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
    d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
    c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
    b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
    a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
    d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
    c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
    b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
    a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
    d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
    c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
    b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
    a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
    d = md5hh(d, a, b, c, x[i], 11, -358537222);
    c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
    b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
    a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
    d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
    c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
    b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
    a = md5ii(a, b, c, d, x[i], 6, -198630844);
    d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
    c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
    b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
    a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
    d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
    c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
    b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
    a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
    d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
    c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
    b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
    a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
    d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
    c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
    b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
    a = safeAdd(a, olda);
    b = safeAdd(b, oldb);
    c = safeAdd(c, oldc);
    d = safeAdd(d, oldd);
  }

  return [a, b, c, d];
}
/*
 * Convert an array bytes to an array of little-endian words
 * Characters >255 have their high-byte silently ignored.
 */


function bytesToWords(input) {
  if (input.length === 0) {
    return [];
  }

  var length8 = input.length * 8;
  var output = new Uint32Array(getOutputLength(length8));

  for (var i = 0; i < length8; i += 8) {
    output[i >> 5] |= (input[i / 8] & 0xff) << i % 32;
  }

  return output;
}
/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */


function safeAdd(x, y) {
  var lsw = (x & 0xffff) + (y & 0xffff);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return msw << 16 | lsw & 0xffff;
}
/*
 * Bitwise rotate a 32-bit number to the left.
 */


function bitRotateLeft(num, cnt) {
  return num << cnt | num >>> 32 - cnt;
}
/*
 * These functions implement the four basic operations the algorithm uses.
 */


function md5cmn(q, a, b, x, s, t) {
  return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
}

function md5ff(a, b, c, d, x, s, t) {
  return md5cmn(b & c | ~b & d, a, b, x, s, t);
}

function md5gg(a, b, c, d, x, s, t) {
  return md5cmn(b & d | c & ~d, a, b, x, s, t);
}

function md5hh(a, b, c, d, x, s, t) {
  return md5cmn(b ^ c ^ d, a, b, x, s, t);
}

function md5ii(a, b, c, d, x, s, t) {
  return md5cmn(c ^ (b | ~d), a, b, x, s, t);
}

var v3 = v35('v3', 0x30, md5);
var v3$1 = v3;

function v4(options, buf, offset) {
  options = options || {};
  var rnds = options.random || (options.rng || rng)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

  rnds[6] = rnds[6] & 0x0f | 0x40;
  rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

  if (buf) {
    offset = offset || 0;

    for (var i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }

    return buf;
  }

  return stringify$2(rnds);
}

// Adapted from Chris Veness' SHA1 code at
// http://www.movable-type.co.uk/scripts/sha1.html
function f(s, x, y, z) {
  switch (s) {
    case 0:
      return x & y ^ ~x & z;

    case 1:
      return x ^ y ^ z;

    case 2:
      return x & y ^ x & z ^ y & z;

    case 3:
      return x ^ y ^ z;
  }
}

function ROTL(x, n) {
  return x << n | x >>> 32 - n;
}

function sha1(bytes) {
  var K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];
  var H = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];

  if (typeof bytes === 'string') {
    var msg = unescape(encodeURIComponent(bytes)); // UTF8 escape

    bytes = [];

    for (var i = 0; i < msg.length; ++i) {
      bytes.push(msg.charCodeAt(i));
    }
  } else if (!Array.isArray(bytes)) {
    // Convert Array-like to Array
    bytes = Array.prototype.slice.call(bytes);
  }

  bytes.push(0x80);
  var l = bytes.length / 4 + 2;
  var N = Math.ceil(l / 16);
  var M = new Array(N);

  for (var _i = 0; _i < N; ++_i) {
    var arr = new Uint32Array(16);

    for (var j = 0; j < 16; ++j) {
      arr[j] = bytes[_i * 64 + j * 4] << 24 | bytes[_i * 64 + j * 4 + 1] << 16 | bytes[_i * 64 + j * 4 + 2] << 8 | bytes[_i * 64 + j * 4 + 3];
    }

    M[_i] = arr;
  }

  M[N - 1][14] = (bytes.length - 1) * 8 / Math.pow(2, 32);
  M[N - 1][14] = Math.floor(M[N - 1][14]);
  M[N - 1][15] = (bytes.length - 1) * 8 & 0xffffffff;

  for (var _i2 = 0; _i2 < N; ++_i2) {
    var W = new Uint32Array(80);

    for (var t = 0; t < 16; ++t) {
      W[t] = M[_i2][t];
    }

    for (var _t = 16; _t < 80; ++_t) {
      W[_t] = ROTL(W[_t - 3] ^ W[_t - 8] ^ W[_t - 14] ^ W[_t - 16], 1);
    }

    var a = H[0];
    var b = H[1];
    var c = H[2];
    var d = H[3];
    var e = H[4];

    for (var _t2 = 0; _t2 < 80; ++_t2) {
      var s = Math.floor(_t2 / 20);
      var T = ROTL(a, 5) + f(s, b, c, d) + e + K[s] + W[_t2] >>> 0;
      e = d;
      d = c;
      c = ROTL(b, 30) >>> 0;
      b = a;
      a = T;
    }

    H[0] = H[0] + a >>> 0;
    H[1] = H[1] + b >>> 0;
    H[2] = H[2] + c >>> 0;
    H[3] = H[3] + d >>> 0;
    H[4] = H[4] + e >>> 0;
  }

  return [H[0] >> 24 & 0xff, H[0] >> 16 & 0xff, H[0] >> 8 & 0xff, H[0] & 0xff, H[1] >> 24 & 0xff, H[1] >> 16 & 0xff, H[1] >> 8 & 0xff, H[1] & 0xff, H[2] >> 24 & 0xff, H[2] >> 16 & 0xff, H[2] >> 8 & 0xff, H[2] & 0xff, H[3] >> 24 & 0xff, H[3] >> 16 & 0xff, H[3] >> 8 & 0xff, H[3] & 0xff, H[4] >> 24 & 0xff, H[4] >> 16 & 0xff, H[4] >> 8 & 0xff, H[4] & 0xff];
}

var v5 = v35('v5', 0x50, sha1);
var v5$1 = v5;

var nil = '00000000-0000-0000-0000-000000000000';

function version(uuid) {
  if (!validate(uuid)) {
    throw TypeError('Invalid UUID');
  }

  return parseInt(uuid.substr(14, 1), 16);
}

var esmBrowser = /*#__PURE__*/Object.freeze({
	__proto__: null,
	v1: v1,
	v3: v3$1,
	v4: v4,
	v5: v5$1,
	NIL: nil,
	version: version,
	validate: validate,
	stringify: stringify$2,
	parse: parse
});

var require$$3 = /*@__PURE__*/getAugmentedNamespace(esmBrowser);

let rfc = rfc6902;
let dateToIsoString = dateToIsoString_1;
let stringify$1 = stringify_1;
let {v4: uuid} = require$$3;

var createPatch$1 = function createPatch(original, dto, options) {
	let clonedOriginal = toCompareObject(original, options);
	let clonedDto = toCompareObject(dto, options);
	let changes = rfc.createPatch(clonedOriginal, clonedDto);
	changes = changes.map(addOldValue);
	return changes;

	function addOldValue(change) {
		if (change.op === 'remove' || change.op === 'replace') {
			let splitPath = change.path.split('/');
			splitPath.shift();
			change.oldValue = splitPath.reduce(extract, clonedOriginal);
		}
		else
			return change;

		function extract(obj, element) {
			return obj[element];
		}

		return change;
	}

	function toCompareObject(object, options) {
		if (Array.isArray(object)) {
			let copy = { __patchType: 'Array' };
			for (let i = 0; i < object.length; i++) {
				let element = toCompareObject(object[i], options);
				if (options && options.keys && element === Object(element)) {
					let key = [];
					for (let i = 0; i < options.keys.length; i++) {
						let keyName = options.keys[i].name;
						key.push(negotiateTempKey(element[keyName]));
					}
					copy[stringify$1(key)] = element;
				}
				else if (element === Object(element) && 'id' in element)
					copy[stringify$1(element.id)] = element;
				else
					copy[i] = element;
			}
			return copy;
		}
		else if (isValidDate(object))
			return dateToIsoString(object);
		else if (object === Object(object)) {
			let copy = {};
			for (let name in object) {
				copy[name] = toCompareObject(object[name], options && options.relations && options.relations[name]);
			}
			return copy;
		}
		return object;
	}

	function isValidDate(d) {
		return d instanceof Date && !isNaN(d);
	}

	function negotiateTempKey(value) {
		if (value === undefined)
			return `~${uuid()}`;
		else
			return value;
	}

};

var global$1 =
  (typeof globalThis !== 'undefined' && globalThis) ||
  (typeof self !== 'undefined' && self) ||
  (typeof global$1 !== 'undefined' && global$1);

var support = {
  searchParams: 'URLSearchParams' in global$1,
  iterable: 'Symbol' in global$1 && 'iterator' in Symbol,
  blob:
    'FileReader' in global$1 &&
    'Blob' in global$1 &&
    (function() {
      try {
        new Blob();
        return true
      } catch (e) {
        return false
      }
    })(),
  formData: 'FormData' in global$1,
  arrayBuffer: 'ArrayBuffer' in global$1
};

function isDataView(obj) {
  return obj && DataView.prototype.isPrototypeOf(obj)
}

if (support.arrayBuffer) {
  var viewClasses = [
    '[object Int8Array]',
    '[object Uint8Array]',
    '[object Uint8ClampedArray]',
    '[object Int16Array]',
    '[object Uint16Array]',
    '[object Int32Array]',
    '[object Uint32Array]',
    '[object Float32Array]',
    '[object Float64Array]'
  ];

  var isArrayBufferView =
    ArrayBuffer.isView ||
    function(obj) {
      return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
    };
}

function normalizeName(name) {
  if (typeof name !== 'string') {
    name = String(name);
  }
  if (/[^a-z0-9\-#$%&'*+.^_`|~!]/i.test(name) || name === '') {
    throw new TypeError('Invalid character in header field name: "' + name + '"')
  }
  return name.toLowerCase()
}

function normalizeValue(value) {
  if (typeof value !== 'string') {
    value = String(value);
  }
  return value
}

// Build a destructive iterator for the value list
function iteratorFor(items) {
  var iterator = {
    next: function() {
      var value = items.shift();
      return {done: value === undefined, value: value}
    }
  };

  if (support.iterable) {
    iterator[Symbol.iterator] = function() {
      return iterator
    };
  }

  return iterator
}

function Headers$1(headers) {
  this.map = {};

  if (headers instanceof Headers$1) {
    headers.forEach(function(value, name) {
      this.append(name, value);
    }, this);
  } else if (Array.isArray(headers)) {
    headers.forEach(function(header) {
      this.append(header[0], header[1]);
    }, this);
  } else if (headers) {
    Object.getOwnPropertyNames(headers).forEach(function(name) {
      this.append(name, headers[name]);
    }, this);
  }
}

Headers$1.prototype.append = function(name, value) {
  name = normalizeName(name);
  value = normalizeValue(value);
  var oldValue = this.map[name];
  this.map[name] = oldValue ? oldValue + ', ' + value : value;
};

Headers$1.prototype['delete'] = function(name) {
  delete this.map[normalizeName(name)];
};

Headers$1.prototype.get = function(name) {
  name = normalizeName(name);
  return this.has(name) ? this.map[name] : null
};

Headers$1.prototype.has = function(name) {
  return this.map.hasOwnProperty(normalizeName(name))
};

Headers$1.prototype.set = function(name, value) {
  this.map[normalizeName(name)] = normalizeValue(value);
};

Headers$1.prototype.forEach = function(callback, thisArg) {
  for (var name in this.map) {
    if (this.map.hasOwnProperty(name)) {
      callback.call(thisArg, this.map[name], name, this);
    }
  }
};

Headers$1.prototype.keys = function() {
  var items = [];
  this.forEach(function(value, name) {
    items.push(name);
  });
  return iteratorFor(items)
};

Headers$1.prototype.values = function() {
  var items = [];
  this.forEach(function(value) {
    items.push(value);
  });
  return iteratorFor(items)
};

Headers$1.prototype.entries = function() {
  var items = [];
  this.forEach(function(value, name) {
    items.push([name, value]);
  });
  return iteratorFor(items)
};

if (support.iterable) {
  Headers$1.prototype[Symbol.iterator] = Headers$1.prototype.entries;
}

function consumed(body) {
  if (body.bodyUsed) {
    return Promise.reject(new TypeError('Already read'))
  }
  body.bodyUsed = true;
}

function fileReaderReady(reader) {
  return new Promise(function(resolve, reject) {
    reader.onload = function() {
      resolve(reader.result);
    };
    reader.onerror = function() {
      reject(reader.error);
    };
  })
}

function readBlobAsArrayBuffer(blob) {
  var reader = new FileReader();
  var promise = fileReaderReady(reader);
  reader.readAsArrayBuffer(blob);
  return promise
}

function readBlobAsText(blob) {
  var reader = new FileReader();
  var promise = fileReaderReady(reader);
  reader.readAsText(blob);
  return promise
}

function readArrayBufferAsText(buf) {
  var view = new Uint8Array(buf);
  var chars = new Array(view.length);

  for (var i = 0; i < view.length; i++) {
    chars[i] = String.fromCharCode(view[i]);
  }
  return chars.join('')
}

function bufferClone(buf) {
  if (buf.slice) {
    return buf.slice(0)
  } else {
    var view = new Uint8Array(buf.byteLength);
    view.set(new Uint8Array(buf));
    return view.buffer
  }
}

function Body() {
  this.bodyUsed = false;

  this._initBody = function(body) {
    /*
      fetch-mock wraps the Response object in an ES6 Proxy to
      provide useful test harness features such as flush. However, on
      ES5 browsers without fetch or Proxy support pollyfills must be used;
      the proxy-pollyfill is unable to proxy an attribute unless it exists
      on the object before the Proxy is created. This change ensures
      Response.bodyUsed exists on the instance, while maintaining the
      semantic of setting Request.bodyUsed in the constructor before
      _initBody is called.
    */
    this.bodyUsed = this.bodyUsed;
    this._bodyInit = body;
    if (!body) {
      this._bodyText = '';
    } else if (typeof body === 'string') {
      this._bodyText = body;
    } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
      this._bodyBlob = body;
    } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
      this._bodyFormData = body;
    } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
      this._bodyText = body.toString();
    } else if (support.arrayBuffer && support.blob && isDataView(body)) {
      this._bodyArrayBuffer = bufferClone(body.buffer);
      // IE 10-11 can't handle a DataView body.
      this._bodyInit = new Blob([this._bodyArrayBuffer]);
    } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
      this._bodyArrayBuffer = bufferClone(body);
    } else {
      this._bodyText = body = Object.prototype.toString.call(body);
    }

    if (!this.headers.get('content-type')) {
      if (typeof body === 'string') {
        this.headers.set('content-type', 'text/plain;charset=UTF-8');
      } else if (this._bodyBlob && this._bodyBlob.type) {
        this.headers.set('content-type', this._bodyBlob.type);
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
      }
    }
  };

  if (support.blob) {
    this.blob = function() {
      var rejected = consumed(this);
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return Promise.resolve(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(new Blob([this._bodyArrayBuffer]))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as blob')
      } else {
        return Promise.resolve(new Blob([this._bodyText]))
      }
    };

    this.arrayBuffer = function() {
      if (this._bodyArrayBuffer) {
        var isConsumed = consumed(this);
        if (isConsumed) {
          return isConsumed
        }
        if (ArrayBuffer.isView(this._bodyArrayBuffer)) {
          return Promise.resolve(
            this._bodyArrayBuffer.buffer.slice(
              this._bodyArrayBuffer.byteOffset,
              this._bodyArrayBuffer.byteOffset + this._bodyArrayBuffer.byteLength
            )
          )
        } else {
          return Promise.resolve(this._bodyArrayBuffer)
        }
      } else {
        return this.blob().then(readBlobAsArrayBuffer)
      }
    };
  }

  this.text = function() {
    var rejected = consumed(this);
    if (rejected) {
      return rejected
    }

    if (this._bodyBlob) {
      return readBlobAsText(this._bodyBlob)
    } else if (this._bodyArrayBuffer) {
      return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
    } else if (this._bodyFormData) {
      throw new Error('could not read FormData body as text')
    } else {
      return Promise.resolve(this._bodyText)
    }
  };

  if (support.formData) {
    this.formData = function() {
      return this.text().then(decode)
    };
  }

  this.json = function() {
    return this.text().then(JSON.parse)
  };

  return this
}

// HTTP methods whose capitalization should be normalized
var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

function normalizeMethod(method) {
  var upcased = method.toUpperCase();
  return methods.indexOf(upcased) > -1 ? upcased : method
}

function Request$1(input, options) {
  if (!(this instanceof Request$1)) {
    throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.')
  }

  options = options || {};
  var body = options.body;

  if (input instanceof Request$1) {
    if (input.bodyUsed) {
      throw new TypeError('Already read')
    }
    this.url = input.url;
    this.credentials = input.credentials;
    if (!options.headers) {
      this.headers = new Headers$1(input.headers);
    }
    this.method = input.method;
    this.mode = input.mode;
    this.signal = input.signal;
    if (!body && input._bodyInit != null) {
      body = input._bodyInit;
      input.bodyUsed = true;
    }
  } else {
    this.url = String(input);
  }

  this.credentials = options.credentials || this.credentials || 'same-origin';
  if (options.headers || !this.headers) {
    this.headers = new Headers$1(options.headers);
  }
  this.method = normalizeMethod(options.method || this.method || 'GET');
  this.mode = options.mode || this.mode || null;
  this.signal = options.signal || this.signal;
  this.referrer = null;

  if ((this.method === 'GET' || this.method === 'HEAD') && body) {
    throw new TypeError('Body not allowed for GET or HEAD requests')
  }
  this._initBody(body);

  if (this.method === 'GET' || this.method === 'HEAD') {
    if (options.cache === 'no-store' || options.cache === 'no-cache') {
      // Search for a '_' parameter in the query string
      var reParamSearch = /([?&])_=[^&]*/;
      if (reParamSearch.test(this.url)) {
        // If it already exists then set the value with the current time
        this.url = this.url.replace(reParamSearch, '$1_=' + new Date().getTime());
      } else {
        // Otherwise add a new '_' parameter to the end with the current time
        var reQueryString = /\?/;
        this.url += (reQueryString.test(this.url) ? '&' : '?') + '_=' + new Date().getTime();
      }
    }
  }
}

Request$1.prototype.clone = function() {
  return new Request$1(this, {body: this._bodyInit})
};

function decode(body) {
  var form = new FormData();
  body
    .trim()
    .split('&')
    .forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=');
        var name = split.shift().replace(/\+/g, ' ');
        var value = split.join('=').replace(/\+/g, ' ');
        form.append(decodeURIComponent(name), decodeURIComponent(value));
      }
    });
  return form
}

function parseHeaders(rawHeaders) {
  var headers = new Headers$1();
  // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
  // https://tools.ietf.org/html/rfc7230#section-3.2
  var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ');
  // Avoiding split via regex to work around a common IE11 bug with the core-js 3.6.0 regex polyfill
  // https://github.com/github/fetch/issues/748
  // https://github.com/zloirock/core-js/issues/751
  preProcessedHeaders
    .split('\r')
    .map(function(header) {
      return header.indexOf('\n') === 0 ? header.substr(1, header.length) : header
    })
    .forEach(function(line) {
      var parts = line.split(':');
      var key = parts.shift().trim();
      if (key) {
        var value = parts.join(':').trim();
        headers.append(key, value);
      }
    });
  return headers
}

Body.call(Request$1.prototype);

function Response(bodyInit, options) {
  if (!(this instanceof Response)) {
    throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.')
  }
  if (!options) {
    options = {};
  }

  this.type = 'default';
  this.status = options.status === undefined ? 200 : options.status;
  this.ok = this.status >= 200 && this.status < 300;
  this.statusText = options.statusText === undefined ? '' : '' + options.statusText;
  this.headers = new Headers$1(options.headers);
  this.url = options.url || '';
  this._initBody(bodyInit);
}

Body.call(Response.prototype);

Response.prototype.clone = function() {
  return new Response(this._bodyInit, {
    status: this.status,
    statusText: this.statusText,
    headers: new Headers$1(this.headers),
    url: this.url
  })
};

Response.error = function() {
  var response = new Response(null, {status: 0, statusText: ''});
  response.type = 'error';
  return response
};

var redirectStatuses = [301, 302, 303, 307, 308];

Response.redirect = function(url, status) {
  if (redirectStatuses.indexOf(status) === -1) {
    throw new RangeError('Invalid status code')
  }

  return new Response(null, {status: status, headers: {location: url}})
};

var DOMException = global$1.DOMException;
try {
  new DOMException();
} catch (err) {
  DOMException = function(message, name) {
    this.message = message;
    this.name = name;
    var error = Error(message);
    this.stack = error.stack;
  };
  DOMException.prototype = Object.create(Error.prototype);
  DOMException.prototype.constructor = DOMException;
}

function fetch$1(input, init) {
  return new Promise(function(resolve, reject) {
    var request = new Request$1(input, init);

    if (request.signal && request.signal.aborted) {
      return reject(new DOMException('Aborted', 'AbortError'))
    }

    var xhr = new XMLHttpRequest();

    function abortXhr() {
      xhr.abort();
    }

    xhr.onload = function() {
      var options = {
        status: xhr.status,
        statusText: xhr.statusText,
        headers: parseHeaders(xhr.getAllResponseHeaders() || '')
      };
      options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL');
      var body = 'response' in xhr ? xhr.response : xhr.responseText;
      setTimeout(function() {
        resolve(new Response(body, options));
      }, 0);
    };

    xhr.onerror = function() {
      setTimeout(function() {
        reject(new TypeError('Network request failed'));
      }, 0);
    };

    xhr.ontimeout = function() {
      setTimeout(function() {
        reject(new TypeError('Network request failed'));
      }, 0);
    };

    xhr.onabort = function() {
      setTimeout(function() {
        reject(new DOMException('Aborted', 'AbortError'));
      }, 0);
    };

    function fixUrl(url) {
      try {
        return url === '' && global$1.location.href ? global$1.location.href : url
      } catch (e) {
        return url
      }
    }

    xhr.open(request.method, fixUrl(request.url), true);

    if (request.credentials === 'include') {
      xhr.withCredentials = true;
    } else if (request.credentials === 'omit') {
      xhr.withCredentials = false;
    }

    if ('responseType' in xhr) {
      if (support.blob) {
        xhr.responseType = 'blob';
      } else if (
        support.arrayBuffer &&
        request.headers.get('Content-Type') &&
        request.headers.get('Content-Type').indexOf('application/octet-stream') !== -1
      ) {
        xhr.responseType = 'arraybuffer';
      }
    }

    if (init && typeof init.headers === 'object' && !(init.headers instanceof Headers$1)) {
      Object.getOwnPropertyNames(init.headers).forEach(function(name) {
        xhr.setRequestHeader(name, normalizeValue(init.headers[name]));
      });
    } else {
      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value);
      });
    }

    if (request.signal) {
      request.signal.addEventListener('abort', abortXhr);

      xhr.onreadystatechange = function() {
        // DONE (success or failure)
        if (xhr.readyState === 4) {
          request.signal.removeEventListener('abort', abortXhr);
        }
      };
    }

    xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
  })
}

fetch$1.polyfill = true;

if (!global$1.fetch) {
  global$1.fetch = fetch$1;
  global$1.Headers = Headers$1;
  global$1.Request = Request$1;
  global$1.Response = Response;
}

// the whatwg-fetch polyfill installs the fetch() function
// on the global object (window or self)
//
// Return that as the export for use in Webpack, Browserify etc.

self.fetch.bind(self);

function httpAdapter(url, {beforeRequest : _beforeRequest, beforeResponse: _beforeResponse}) {
	let c = {
		get,
		post,
		patch,
		query,
		express
	};

	return c;


	async function get() {
		// eslint-disable-next-line no-undef
		let headers = new Headers();
		headers.append('Content-Type', 'application/json');
		headers.append('Accept', 'application/json');
		let request = { url, init: { method: 'GET', headers } };
		let response = await sendRequest(request);
		return handleResponse(response);
	}

	async function patch(body) {
		// eslint-disable-next-line no-undef
		var headers = new Headers();
		headers.append('Content-Type', 'application/json');
		let request = { url, init: { method: 'PATCH', headers, body } };
		let response = await sendRequest(request);
		return handleResponse(response);
	}

	async function post(body) {
		// eslint-disable-next-line no-undef
		var headers = new Headers();
		headers.append('Content-Type', 'application/json');
		let response = await sendRequest({ url, init: { method: 'POST', headers, body } });
		return handleResponse(response);
	}

	async function sendRequest({ url, init }, { attempts = 0 } = {}) {
		if (_beforeRequest) {
			init = await _beforeRequest(init) || init;
		}
		// eslint-disable-next-line no-undef
		let request = new Request(url, init);
		// eslint-disable-next-line no-undef
		return beforeResponse(await fetch(request), { url, init, attempts });
	}

	async function beforeResponse(response, { url, init, attempts }) {
		if (!_beforeResponse)
			return response;

		let shouldRetry;
		await _beforeResponse(response.clone(), { retry, attempts, request: init });
		if (shouldRetry)
			return sendRequest({ url, init }, { attempts: ++attempts });
		return response;

		function retry() {
			shouldRetry = true;
		}
	}

	async function handleResponse(response) {
		if (response.status >= 200 && response.status < 300) {
			return response.json();
		}
		else {
			let msg = response.text && await response.text() || `Status ${response.status} from server`;
			let e = new Error(msg);
			e.status = response.status;
			throw e;
		}
	}

	function query() {
		throw new Error('Queries are not supported through http');
	}

	function express() {
		throw new Error('Hosting in express is not supported on the client side');
	}
}

function createNetAdapter(url, options = {}) {
	if (url && url.hostLocal)
		return url.hostLocal(options.tableOptions);
	else if (url &&  url.query)
		return url;
	else if (url &&  typeof url === 'function' && url().query)
		return url();
	else
		return httpAdapter(url, options);
}

var netAdapter$1 = createNetAdapter;

let onChange = cjs;
let createPatch = createPatch$1;
let stringify = stringify_1;
let netAdapter = netAdapter$1;
let rootMap = new WeakMap();
let targetKey  = Symbol();

function rdbClient(options = {}) {
	if (options.pg)
		options = {db: options};
	let beforeResponse = options.beforeResponse;
	let beforeRequest = options.beforeRequest;
	let transaction = options.transaction;
	let _reactive = options.reactive;
	let baseUrl = options.db;
	function client(_options = {}) {
		if (_options.pg)
			_options = {db: _options};
		return rdbClient({...options,..._options});
	}

	if (options.tables) {
		for(let name in options.tables) {
			client[name] = table(options.tables[name]);
		}
		client.tables = options.tables;
	}

	client.Concurrencies = {
		Optimistic: 'optimistic',
		SkipOnConflict: 'skipOnConflict',
		Overwrite: 'overwrite'
	};
	client.beforeResponse = (cb => beforeResponse = cb);
	client.beforeRequest = (cb => beforeRequest = cb);
	client.reactive = (cb => _reactive = cb);
	client.table = table;
	client.or = column('or');
	client.and = column('and');
	client.not = column('not');
	client.filter = {
		or: client.or,
		and: client.and,
		not: client.not,
		toJSON: function() {
			return;
		}
	};
	client.query = query;
	client.transaction = runInTransaction;
	client.db = baseUrl;

	return client;

	async function query() {
		return netAdapter(baseUrl,{tableOptions: {db: baseUrl}} ).query.apply(null, arguments);
	}

	async function runInTransaction(fn, _options) {
		let db = baseUrl;
		if (typeof db === 'function') {
			let dbPromise = db();
			if (dbPromise.then)
				db = await dbPromise;
			else
				db = dbPromise;
		}
		if (!db.createTransaction)
			throw new Error('Transaction not supported through http');
		const transaction =  db.createTransaction(_options);
		try {
			const nextClient = client({transaction});
			await fn(nextClient);
			await transaction(db.commit);
		}
		catch(e) {
			await transaction(db.rollback.bind(null, e));
		}
	}

	function table(url, tableOptions) {
		if (baseUrl && typeof url === 'string')
			url = baseUrl + url;
		else if (baseUrl) {
			tableOptions = tableOptions || {};
			tableOptions = {db: baseUrl, ...tableOptions, transaction};
		}
		let meta;
		let c = {
			getManyDto: getMany,
			getMany,
			express,
			getOne: tryGetFirst,
			tryGetFirst,
			tryGetById,
			getById,
			proxify,
			insert,
			insertAndForget,
			delete: _delete,
			cascadeDelete
		};

		let handler = {
			get(_target, property,) {
				if (property in c)
					return Reflect.get(...arguments);
				else
					return column(property);
			}

		};
		let _table = new Proxy(c, handler);
		return _table;

		async function getMany(_, strategy) {
			let metaPromise = getMeta();
			strategy = extractStrategy({strategy});
			let args = [_, strategy].concat(Array.prototype.slice.call(arguments).slice(2));
			let rows = await getManyCore.apply(null, args);
			await metaPromise;
			return proxify(rows, strategy);
		}

		async function tryGetFirst(filter, strategy) {
			let metaPromise = getMeta();
			strategy = extractStrategy({strategy});
			let _strategy = { ...strategy, ...{ limit: 1 } };
			let args = [filter, _strategy].concat(Array.prototype.slice.call(arguments).slice(2));
			let rows = await getManyCore.apply(null, args);
			await metaPromise;
			if (rows.length === 0)
				return;
			return proxify(rows[0], strategy);
		}

		async function tryGetById() {
			if (arguments.length === 0)
				return;
			let meta = await getMeta();
			let keyFilter = client.filter;
			for (let i = 0; i < meta.keys.length; i++) {
				let keyName = meta.keys[i].name;
				let keyValue = arguments[i];
				keyFilter = keyFilter.and(_table[keyName].eq(keyValue));
			}
			let args = [keyFilter].concat(Array.prototype.slice.call(arguments).slice(meta.keys.length));
			return tryGetFirst.apply(null, args);
		}

		function express() {
			return netAdapter(url, {beforeRequest, beforeResponse, tableOptions}).express.apply(null, arguments);
		}

		async function getById() {
			let row = await tryGetById.apply(null, arguments);
			if (!row)
				throw new Error('Row not found : ' + arguments);
			return row;
		}

		async function getManyCore() {
			let args = Array.prototype.slice.call(arguments);
			let body = stringify({
				path: 'getManyDto',
				args
			});
			let adapter = netAdapter(url, {beforeRequest, beforeResponse, tableOptions});
			return adapter.post(body);
		}

		async function insertAndForget() {
			let args = Array.prototype.slice.call(arguments);
			let body = stringify({
				path: 'insertAndForget',
				args
			});
			let adapter = netAdapter(url, {beforeRequest, beforeResponse, tableOptions});
			return adapter.post(body);
		}

		async function _delete() {
			let args = Array.prototype.slice.call(arguments);
			let body = stringify({
				path: 'delete',
				args
			});
			let adapter = netAdapter(url, {beforeRequest, beforeResponse, tableOptions});
			return adapter.post(body);
		}

		async function cascadeDelete() {
			let args = Array.prototype.slice.call(arguments);
			let body = stringify({
				path: 'cascadeDelete',
				args
			});
			let adapter = netAdapter(url, {beforeRequest, beforeResponse, tableOptions});
			return adapter.post(body);
		}

		async function insert(rows, ...options) {
			let proxy = proxify(rows);
			return proxy.insert.apply(proxy, options);
		}

		function proxify(itemOrArray, strategy) {
			if (Array.isArray(itemOrArray))
				return proxifyArray(itemOrArray, strategy);
			else
				return proxifyRow(itemOrArray, strategy);
		}

		function proxifyArray(array, strategy) {
			let _array = array;
			if (_reactive)
				array = _reactive(array);
			let enabled = false;
			let handler = {
				get(_target, property) {
					if (property === 'toJSON')
						return () => {
							return toJSON(array);
						};
					else if (property === 'save')
						return saveArray.bind(null, array);
					else if (property === 'insert')
						return insertArray.bind(null, array, arrayProxy);
					else if (property === 'delete')
						return deleteArray.bind(null, array);
					else if (property === 'refresh')
						return refreshArray.bind(null, array);
					else if (property === 'clearChanges')
						return clearChangesArray.bind(null, array);
					else if (property === 'acceptChanges')
						return acceptChangesArray.bind(null, array);
					else if (property === targetKey)
						return _array;
					else
						return Reflect.get.apply(_array, arguments);
				}

			};
			let innerProxy = new Proxy(array, handler);
			let arrayProxy = onChange(innerProxy, () => { return;}, { pathAsArray: true, ignoreDetached: true, details: true, onValidate });
			rootMap.set(array, { jsonMap: new Map(), original: new Set(array), strategy });
			enabled = true;
			return arrayProxy;

			function onValidate(path) {
				if (!enabled)
					return true;
				if (enabled && path.length > 0) {
					let { jsonMap } = rootMap.get(array);
					if (!jsonMap.has(array[path[0]]))
						jsonMap.set(array[path[0]], stringify(array[path[0]]));
				}
				return true;
			}

		}

		function proxifyRow(row, strategy) {
			let enabled = false;
			let handler = {
				get(_target, property,) {
					if (property === 'save') //call server then acceptChanges
						return saveRow.bind(null, row);
					else if (property === 'insert') //call server then remove from jsonMap and add to original
						return insertRow.bind(null, row, rowProxy);
					else if (property === 'delete') //call server then remove from jsonMap and original
						return deleteRow.bind(null, row);
					else if (property === 'refresh') //refresh from server then acceptChanges
						return refreshRow.bind(null, row);
					else if (property === 'clearChanges') //refresh from jsonMap, update original if present
						return clearChangesRow.bind(null, row);
					else if (property === 'acceptChanges') //remove from jsonMap
						return acceptChangesRow.bind(null, row);
					else if (property === 'toJSON')
						return () => {
							return toJSON(row);
						};
					else if (property === targetKey)
						return row;
					else
						return Reflect.get(...arguments);
				}

			};
			let innerProxy = new Proxy(row, handler);
			let rowProxy = onChange(innerProxy, () => { return;}, { pathAsArray: true, ignoreDetached: true, details: true, onValidate });
			rootMap.set(row, { json: stringify(row), strategy });
			enabled = true;
			return rowProxy;

			function onValidate() {
				if (!enabled)
					return false;
				let root = rootMap.get(row);
				if (!root.json)
					root.json = stringify(row);
				return true;
			}
		}

		function toJSON(row, _meta = meta) {
			if (!_meta)
				return row;
			if (Array.isArray(row)) {
				return row.map(x => toJSON(x, _meta));
			}
			let result = {};
			for(let name in row) {
				if (name in _meta.relations)
					result[name] = toJSON(row[name], _meta.relations[name]);
				else if (name in _meta.columns) {
					if(_meta.columns[name].serializable)
						result[name] = row[name];
				}
				else
					result[name] = row[name];
			}
			return result;
		}

		async function getMeta() {
			if (meta)
				return meta;
			let adapter = netAdapter(url, {beforeRequest, beforeResponse, tableOptions});
			meta = await adapter.get();

			while(hasUnresolved(meta)) {
				meta = parseMeta(meta);
			}
			return meta;

			function parseMeta(meta, map = new Map()) {
				if (typeof meta === 'number') {
					return map.get(meta) || meta;
				}
				map.set(meta.id, meta);
				for(let p in meta.relations) {
					meta.relations[p] = parseMeta(meta.relations[p], map);
				}
				return meta;
			}

			function hasUnresolved(meta, set = new WeakSet()) {
				if (typeof meta === 'number')
					return true;
				else if (set.has(meta))
					return false;
				else {
					set.add(meta);
					return Object.values(meta.relations).reduce((prev, current) => {
						return prev || hasUnresolved(current, set);
					}, false);
				}
			}


		}



		async function saveArray(array, options) {
			let { original, jsonMap } = rootMap.get(array);
			let strategy = extractStrategy(options, array);
			let meta = await getMeta();
			let { added, removed, changed } = difference(original, new Set(array), jsonMap);
			let insertPatch = createPatch([], added, meta);
			let deletePatch = createPatch(removed, [], meta);
			let updatePatch = createPatch(changed.map(x => JSON.parse(jsonMap.get(x))), changed, meta);
			let patch = [...insertPatch, ...updatePatch, ...deletePatch];
			if (patch.length === 0)
				return;
			let body = stringify({ patch, options: { strategy, ...options} });
			let adapter = netAdapter(url, {beforeRequest, beforeResponse, tableOptions});
			let { updated, inserted } = await adapter.patch(body);
			copyInto(updated, changed);
			copyInto(inserted, added);
			rootMap.set(array, { jsonMap: new Map(), original: new Set(array), strategy });
		}

		function copyInto(from, to) {
			for (let i = 0; i < from.length; i++) {
				for (let p in from[i]) {
					to[i][p] = from[i][p];
				}
			}
		}

		function extractStrategy(options, obj) {
			if (options && 'strategy' in options)
				return options.strategy;
			if (obj) {
				let context = rootMap.get(obj);
				if (context.strategy !== undefined) {
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					let {limit, ...strategy} = context.strategy;
					return strategy;
				}
			}
			if (tableOptions)
				return tableOptions.strategy;
		}



		function clearChangesArray(array) {
			let { original, jsonMap, strategy } = rootMap.get(array);
			let { added, removed, changed } = difference(original, new Set(array), jsonMap);
			added = new Set(added);
			removed = new Set(removed);
			changed = new Set(changed);
			for (let i = 0; i < array.length; i++) {
				let row = array[i];
				if (added.has(row)) {
					array.splice(i, 1);
					i--;
				}
				else if (changed.has(row)) {
					array[i] = JSON.parse(jsonMap.get(row));
				}
			}
			if (removed.size > 0) {
				let i = 0;
				for (let row of original) {
					if (removed.has(row)) {
						if (jsonMap.has(row))
							row = JSON.parse(jsonMap.get(row));
						array.splice(i, 0, row);
					}
					i++;
				}
			}
			rootMap.set(array, { jsonMap: new Map(), original: new Set(array), strategy });
		}

		function acceptChangesArray(array) {
			rootMap.set(array, { jsonMap: new Map(), original: new Set(array) });
		}

		async function insertArray(array, proxy, options) {
			if (array.length === 0)
				return;
			let strategy = extractStrategy(options);
			let meta = await getMeta();
			let patch = createPatch([], array, meta);

			let body = stringify({ patch, options: { strategy, ...options}  });
			let adapter = netAdapter(url, {beforeRequest, beforeResponse, tableOptions});
			let { inserted } = await adapter.patch(body);
			copyInto(inserted, array);
			rootMap.set(array, { jsonMap: new Map(), original: new Set(array), strategy });
			return proxy;
		}

		async function deleteArray(array, options) {
			if (array.length === 0)
				return;
			let meta = await getMeta();
			let patch = createPatch(array, [], meta);
			let body = stringify({ patch, options });
			let adapter = netAdapter(url, {beforeRequest, beforeResponse, tableOptions});
			await adapter.patch(body);
			let strategy = rootMap.get(array).strategy;
			array.length = 0;
			rootMap.set(array, { jsonMap: new Map(), original: new Set(array), strategy });
		}

		function setMapValue(rowsMap, keys, row, index) {
			let keyValue = row[keys[0].name];
			if (keys.length > 1) {
				let subMap = rowsMap.get(keyValue);
				if (!subMap) {
					subMap = new Map();
					rowsMap.set(keyValue, subMap);
				}
				setMapValue(subMap, keys.slice(1), row, index);
			}
			else
				rowsMap.set(keyValue, index);
		}

		function getMapValue(rowsMap, keys, row) {
			let keyValue = row[keys[0].name];
			if (keys.length > 1)
				return getMapValue(rowsMap.get(keyValue), keys.slice(1));
			else
				return rowsMap.get(keyValue);
		}

		async function refreshArray(array, options) {
			let strategy = extractStrategy(options);
			if (array.length === 0)
				return;
			let meta = await getMeta();
			let filter = client.filter;
			let rowsMap = new Map();
			for (let rowIndex = 0; rowIndex < array.length; rowIndex++) {
				let row = array[rowIndex];
				let keyFilter = client.filter;
				for (let i = 0; i < meta.keys.length; i++) {
					let keyName = meta.keys[i].name;
					let keyValue = row[keyName];
					keyFilter = keyFilter.and(_table[keyName].eq(keyValue));
				}
				setMapValue(rowsMap, meta.keys, row, rowIndex);
				filter = filter.or(keyFilter);
			}
			let rows = await getManyCore(filter, strategy);
			let removedIndexes = new Set();
			if (array.length !== rows.length)
				for (var i = 0; i < array.length; i++) {
					removedIndexes.add(i);
				}
			for (let i = 0; i < rows.length; i++) {
				let row = rows[i];
				let originalIndex = getMapValue(rowsMap, meta.keys, row);
				if (array.length !== rows.length)
					removedIndexes.delete(originalIndex);
				array[originalIndex] = row;
			}
			let offset = 0;
			for (let i of removedIndexes) {
				array.splice(i + offset, 1);
				offset--;
			}
			rootMap.set(array, { jsonMap: new Map(), original: new Set(array), strategy });
		}

		async function insertRow(row, proxy, options) {
			let strategy = extractStrategy(options, row);
			let meta = await getMeta();
			let patch = createPatch([], [row], meta);
			let body = stringify({ patch, options: { strategy, ...options} });

			let adapter = netAdapter(url, {beforeRequest, beforeResponse, tableOptions});
			let { inserted } = await adapter.patch(body);
			copyInto(inserted, [row]);
			rootMap.set(row, { strategy });
			return proxy;
		}

		async function deleteRow(row, options) {
			let strategy = extractStrategy(options, row);
			let meta = await getMeta();
			let patch = createPatch([row], [], meta);
			let body = stringify({ patch, options });

			let adapter = netAdapter(url, {beforeRequest, beforeResponse, tableOptions});
			await adapter.patch(body);
			rootMap.set(row, { strategy });
		}

		async function saveRow(row, options) {
			let strategy = extractStrategy(options, row);
			let { json } = rootMap.get(row);
			if (!json)
				return;
			let meta = await getMeta();

			let patch = createPatch([JSON.parse(json)], [row], meta);
			if (patch.length === 0)
				return;

			let body = stringify({ patch, options: { ...options, strategy } });

			let adapter = netAdapter(url, {beforeRequest, beforeResponse, tableOptions});
			let { updated } = await adapter.patch(body);
			copyInto(updated, [row]);
			rootMap.set(row, { strategy });
		}

		async function refreshRow(row, options) {
			let strategy = extractStrategy(options, row);
			let meta = await getMeta();
			let keyFilter = client.filter;
			for (let i = 0; i < meta.keys.length; i++) {
				let keyName = meta.keys[i].name;
				let keyValue = row[keyName];
				keyFilter = keyFilter.and(_table[keyName].eq(keyValue));
			}
			let rows = await getManyCore.apply(keyFilter, strategy);
			for (let p in row) {
				delete row[p];
			}
			if (rows.length === 0)
				return;
			for (let p in rows[0]) {
				row[p] = rows[0][p];
			}
			rootMap.set(row, { strategy });
		}

		function acceptChangesRow(row) {
			rootMap.set(row, {});
		}

		function clearChangesRow(row) {
			let { json } = rootMap.get(row);
			if (!json)
				return;
			let old = JSON.parse(json);
			for (let p in row) {
				delete row[p];
			}
			for (let p in old) {
				row[p] = old[p];
			}
			rootMap.set(row, {});
		}

	}
}

function difference(setA, setB, jsonMap) {
	let removed = new Set(setA);
	let added = [];
	let changed = [];
	for (let elem of setB) {
		if (!setA.has(elem))
			added.push(elem);
		else {
			removed.delete(elem);
			if (jsonMap.get(elem))
				changed.push(elem);
		}
	}

	return { added, removed: Array.from(removed), changed };
}

function tableProxy() {
	let handler = {
		get(_target, property,) {
			return column(property);
		}

	};
	return new Proxy({}, handler);
}


function column(path, ...previous) {
	function c() {
		let args = [];
		for (let i = 0; i < arguments.length; i++) {
			if (typeof arguments[i] === 'function')
				args[i] = arguments[i](tableProxy(path.split('.').slice(0,-1).join('.')));
			else
				args[i] = arguments[i];
		}
		args = previous.concat(Array.prototype.slice.call(args));
		let result = { path, args };
		let handler = {
			get(_target, property) {
				if (property === 'toJSON')
					return result.toJSON;
				if (property in result)
					return Reflect.get(...arguments);
				else
					return column(property, result);

			}
		};
		return new Proxy(result, handler);
	}
	let handler = {
		get(_target, property) {
			if (property === 'toJSON')
				return Reflect.get(...arguments);
			else
				return column(path + '.' + property);
		}

	};
	return new Proxy(c, handler);

}

var client = rdbClient();

export { client as default };
