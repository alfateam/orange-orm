/* eslint-disable @typescript-eslint/no-this-alias */
/* @ts-nocheck */

/**
 * A helper function to schedule a callback in a cross-platform manner:
 * - Uses setImmediate if available (Node).
 * - Else uses queueMicrotask if available (Deno, modern browsers).
 * - Else falls back to setTimeout(fn, 0).
 */
function queueTask(fn) {
	if (typeof setImmediate === 'function') {
		setImmediate(fn);
	}
	else if
	(typeof queueMicrotask === 'function') {
		queueMicrotask(fn);
	} else {
		setTimeout(fn, 0);
	}
}

/**
   * @class
   * @private
   */
function PriorityQueue(size) {
	if (!(this instanceof PriorityQueue)) {
		return new PriorityQueue(size);
	}

	this._size = Math.max(+size | 0, 1);
	this._slots = [];
	this._total = null;

	// initialize arrays to hold queue elements
	for (let i = 0; i < this._size; i += 1) {
		this._slots.push([]);
	}
}

PriorityQueue.prototype.size = function size() {
	if (this._total === null) {
		this._total = 0;
		for (let i = 0; i < this._size; i += 1) {
			this._total += this._slots[i].length;
		}
	}
	return this._total;
};

PriorityQueue.prototype.enqueue = function enqueue(obj, priority) {
	// Convert to integer with a default value of 0.
	priority = priority && +priority | 0 || 0;
	this._total = null;
	if (priority < 0 || priority >= this._size) {
		console.error(
			'invalid priority: ' + priority + ' must be between 0 and ' + (this._size - 1)
		);
		priority = this._size - 1; // put obj at the end of the line
	}
	this._slots[priority].push(obj);
};

PriorityQueue.prototype.dequeue = function dequeue() {
	let obj = null;
	this._total = null;
	for (let i = 0, sl = this._slots.length; i < sl; i += 1) {
		if (this._slots[i].length) {
			obj = this._slots[i].shift();
			break;
		}
	}
	return obj;
};

function doWhileAsync(conditionFn, iterateFn, callbackFn) {
	const next = function() {
		if (conditionFn()) {
			iterateFn(next);
		} else {
			callbackFn();
		}
	};
	next();
}

/**
   * Generate an Object pool with a specified `factory`.
   *
   * @class
   * @param {Object} factory
   *   Factory to be used for generating and destroying the items.
   * @param {String} factory.name
   * @param {Function} factory.create
   * @param {Function} factory.destroy
   * @param {Function} factory.validate
   * @param {Function} factory.validateAsync
   * @param {Number} factory.max
   * @param {Number} factory.min
   * @param {Number} factory.idleTimeoutMillis
   * @param {Number} factory.reapIntervalMillis
   * @param {Boolean|Function} factory.log
   * @param {Number} factory.priorityRange
   * @param {Boolean} factory.refreshIdle
   * @param {Boolean} [factory.returnToHead=false]
   */
function Pool(factory) {
	if (!(this instanceof Pool)) {
		return new Pool(factory);
	}
	if (factory.validate && factory.validateAsync) {
		throw new Error('Only one of validate or validateAsync may be specified');
	}

	// defaults
	factory.idleTimeoutMillis = factory.idleTimeoutMillis || 30000;
	factory.returnToHead = factory.returnToHead || false;
	factory.refreshIdle = ('refreshIdle' in factory) ? factory.refreshIdle : true;
	factory.reapInterval = factory.reapIntervalMillis || 1000;
	factory.priorityRange = factory.priorityRange || 1;
	factory.validate = factory.validate || function() {
		return true;
	};

	factory.max = parseInt(factory.max, 10);
	factory.min = parseInt(factory.min, 10);
	factory.max = Math.max(isNaN(factory.max) ? 1 : factory.max, 1);
	factory.min = Math.min(isNaN(factory.min) ? 0 : factory.min, factory.max - 1);

	this._factory = factory;
	this._inUseObjects = [];
	this._draining = false;
	this._waitingClients = new PriorityQueue(factory.priorityRange);
	this._availableObjects = [];
	this._asyncTestObjects = [];
	this._count = 0;
	this._removeIdleTimer = null;
	this._removeIdleScheduled = false;

	// create initial resources (if factory.min > 0)
	this._ensureMinimum();
}

/**
   * logs to console or user-defined log function
   * @private
   * @param {string} str
   * @param {string} level
   */
Pool.prototype._log = function _log(str, level) {
	if (typeof this._factory.log === 'function') {
		this._factory.log(str, level);
	} else if (this._factory.log) {
		console.log(level.toUpperCase() + ' pool ' + this._factory.name + ' - ' + str);
	}
};

/**
   * Request the client to be destroyed. The factory's destroy handler
   * will also be called.
   *
   * This should be called within an acquire() block as an alternative to release().
   *
   * @param {Object} obj
   *   The acquired item to be destroyed.
   * @param {Function} [cb]
   *   Optional. Callback invoked after client is destroyed
   */
Pool.prototype.destroy = function destroy(obj, cb) {
	this._count -= 1;
	if (this._count < 0) this._count = 0;

	this._availableObjects = this._availableObjects.filter(
		(objWithTimeout) => objWithTimeout.obj !== obj
	);
	this._inUseObjects = this._inUseObjects.filter(
		(objInUse) => objInUse !== obj
	);

	this._factory.destroy(obj, cb);

	// keep compatibility with old interface
	if (this._factory.destroy.length === 1 && cb && typeof cb === 'function') {
		cb();
	}

	this._ensureMinimum();
};

/**
   * Checks and removes the available (idle) clients that have timed out.
   * @private
   */
Pool.prototype._removeIdle = function _removeIdle() {
	const now = new Date().getTime();
	const refreshIdle = this._factory.refreshIdle;
	const maxRemovable = this._count - this._factory.min;
	const toRemove = [];

	this._removeIdleScheduled = false;

	for (let i = 0; i < this._availableObjects.length; i++) {
		const objWithTimeout = this._availableObjects[i];
		if (
			now >= objWithTimeout.timeout &&
			(refreshIdle || toRemove.length < maxRemovable)
		) {
			this._log(
				'removeIdle() destroying obj - now:' +
				now +
				' timeout:' +
				objWithTimeout.timeout,
				'verbose'
			);
			toRemove.push(objWithTimeout.obj);
		}
	}

	toRemove.forEach((obj) => this.destroy(obj));

	if (this._availableObjects.length > 0) {
		this._log(
			'this._availableObjects.length=' + this._availableObjects.length,
			'verbose'
		);
		this._scheduleRemoveIdle();
	} else {
		this._log('removeIdle() all objects removed', 'verbose');
	}
};

/**
   * Schedule removal of idle items in the pool.
   *
   * More schedules cannot run concurrently.
   */
Pool.prototype._scheduleRemoveIdle = function _scheduleRemoveIdle() {
	if (!this._removeIdleScheduled) {
		this._removeIdleScheduled = true;
		this._removeIdleTimer = setTimeout(() => {
			this._removeIdle();
		}, this._factory.reapInterval);
	}
};

/**
   * Try to get a new client to work, and clean up pool unused (idle) items.
   *
   *  - If there are available clients waiting, shift the first one out,
   *    and call its callback.
   *  - If there are no waiting clients, try to create one if it won't exceed
   *    the maximum number of clients.
   *  - If creating a new client would exceed the maximum, add the client to
   *    the wait list.
   * @private
   */
Pool.prototype._dispense = function _dispense() {
	const waitingCount = this._waitingClients.size();
	this._log(
		'dispense() clients=' +
		waitingCount +
		' available=' +
		this._availableObjects.length,
		'info'
	);

	if (waitingCount < 1) {
		return;
	}

	if (this._factory.validateAsync) {
		doWhileAsync(
			() => this._availableObjects.length > 0,
			this._createAsyncValidator(),
			() => {
				if (this._count < this._factory.max) {
					this._createResource();
				}
			}
		);
		return;
	}

	while (this._availableObjects.length > 0) {
		this._log('dispense() - reusing obj', 'verbose');
		const objWithTimeout = this._availableObjects[0];

		if (!this._factory.validate(objWithTimeout.obj)) {
			this.destroy(objWithTimeout.obj);
			continue;
		}

		this._availableObjects.shift();
		this._inUseObjects.push(objWithTimeout.obj);
		const clientCb = this._waitingClients.dequeue();
		return clientCb(null, objWithTimeout.obj);
	}

	if (this._count < this._factory.max) {
		this._createResource();
	}
};

Pool.prototype._createAsyncValidator = function _createAsyncValidator() {
	return (next) => {
		this._log('dispense() - reusing obj', 'verbose');
		const objWithTimeout = this._availableObjects.shift();
		this._asyncTestObjects.push(objWithTimeout);

		this._factory.validateAsync(objWithTimeout.obj, (valid) => {
			const pos = this._asyncTestObjects.indexOf(objWithTimeout);
			this._asyncTestObjects.splice(pos, 1);

			if (!valid) {
				this.destroy(objWithTimeout.obj);
				return next();
			}
			if (this._waitingClients.size() < 1) {
				// no longer anyone waiting for a resource
				this._addResourceToAvailableObjects(objWithTimeout.obj);
				return;
			}

			this._inUseObjects.push(objWithTimeout.obj);
			const clientCb = this._waitingClients.dequeue();
			clientCb(null, objWithTimeout.obj);
		});
	};
};

/**
   * @private
   */
Pool.prototype._createResource = function _createResource() {
	this._count += 1;
	this._log(
		'createResource() - creating obj - count=' +
		this._count +
		' min=' +
		this._factory.min +
		' max=' +
		this._factory.max,
		'verbose'
	);

	this._factory.create((...args) => {
		let err, obj;
		if (args.length > 1) {
			[err, obj] = args;
		} else {
			err = args[0] instanceof Error ? args[0] : null;
			obj = args[0] instanceof Error ? null : args[0];
		}

		const clientCb = this._waitingClients.dequeue();

		if (err) {
			this._count -= 1;
			if (this._count < 0) this._count = 0;
			if (clientCb) {
				clientCb(err, obj);
			}
			// queueTask to simulate process.nextTick
			queueTask(() => {
				this._dispense();
			});
		} else {
			this._inUseObjects.push(obj);
			if (clientCb) {
				clientCb(null, obj);
			} else {
				this._addResourceToAvailableObjects(obj);
			}
		}
	});
};

Pool.prototype._addResourceToAvailableObjects = function(obj) {
	const objWithTimeout = {
		obj,
		timeout: new Date().getTime() + this._factory.idleTimeoutMillis,
	};
	if (this._factory.returnToHead) {
		this._availableObjects.unshift(objWithTimeout);
	} else {
		this._availableObjects.push(objWithTimeout);
	}
	this._dispense();
	this._scheduleRemoveIdle();
};

/**
   * @private
   */
Pool.prototype._ensureMinimum = function _ensureMinimum() {
	if (!this._draining && this._count < this._factory.min) {
		const diff = this._factory.min - this._count;
		for (let i = 0; i < diff; i++) {
			this._createResource();
		}
	}
};

/**
   * Request a new client. The callback will be called
   * when a new client is available.
   *
   * @param {Function} callback
   * @param {Number} [priority]
   * @returns {Boolean} true if the pool is not fully utilized, false otherwise
   */
Pool.prototype.acquire = function acquire(callback, priority) {
	if (this._draining) {
		throw new Error('pool is draining and cannot accept work');
	}
	this._waitingClients.enqueue(callback, priority);
	this._dispense();
	return this._count < this._factory.max;
};

/**
   * @deprecated
   */
Pool.prototype.borrow = function borrow(callback, priority) {
	this._log('borrow() is deprecated. use acquire() instead', 'warn');
	return this.acquire(callback, priority);
};

/**
   * Return the client to the pool, indicating it is no longer needed.
   *
   * @param {Object} obj
   */
Pool.prototype.release = function release(obj) {
	// Check whether this object has already been released
	const alreadyReleased = this._availableObjects.some(o => o.obj === obj);
	if (alreadyReleased) {
		this._log(
			'release called twice for the same resource: ' + new Error().stack,
			'error'
		);
		return;
	}

	// remove from in-use list
	const index = this._inUseObjects.indexOf(obj);
	if (index < 0) {
		this._log(
			'attempt to release an invalid resource: ' + new Error().stack,
			'error'
		);
		return;
	}

	this._inUseObjects.splice(index, 1);
	this._addResourceToAvailableObjects(obj);
};

/**
   * @deprecated
   */
Pool.prototype.returnToPool = function returnToPool(obj) {
	this._log('returnToPool() is deprecated. use release() instead', 'warn');
	this.release(obj);
};

function invoke(cb) {
	queueTask(cb);
}

/**
   * Disallow any new requests and let the request backlog dissipate.
   *
   * @param {Function} [callback]
   *   Callback invoked when all work is done and all clients have been released.
   */
Pool.prototype.drain = function drain(callback) {
	this._log('draining', 'info');
	this._draining = true;

	const check = () => {
		if (this._waitingClients.size() > 0) {
			// wait until all client requests have been satisfied
			return setTimeout(check, 100);
		}
		if (this._asyncTestObjects.length > 0) {
			// wait until async validations are done
			return setTimeout(check, 100);
		}
		if (this._availableObjects.length !== this._count) {
			// wait until in-use objects have been released
			return setTimeout(check, 100);
		}
		if (callback) {
			invoke(callback);
		}
	};
	check();
};

/**
   * Forcibly destroys all clients regardless of timeout.
   * Does not prevent creation of new clients from subsequent calls to acquire.
   *
   * If factory.min > 0, the pool will destroy all idle resources
   * but replace them with newly created resources up to factory.min.
   * If this is not desired, set factory.min to zero before calling.
   *
   * @param {Function} [callback]
   *   Invoked after all existing clients are destroyed.
   */
Pool.prototype.destroyAllNow = function destroyAllNow(callback) {
	this._log('force destroying all objects', 'info');
	const willDie = this._availableObjects;
	this._availableObjects = [];
	const todo = willDie.length;
	let done = 0;

	this._removeIdleScheduled = false;
	clearTimeout(this._removeIdleTimer);

	if (todo === 0 && callback) {
		invoke(callback);
		return;
	}

	while (willDie.length > 0) {
		const { obj } = willDie.shift();
		this.destroy(obj, () => {
			done += 1;
			if (done === todo && callback) {
				invoke(callback);
			}
		});
	}
};

/**
   * Decorates a function to use an acquired client from the pool when called.
   *
   * @param {Function} decorated
   * @param {Number} [priority]
   */
Pool.prototype.pooled = function pooled(decorated, priority) {
	return (...args) => {
		const callerCallback = args[args.length - 1];
		const callerHasCallback = typeof callerCallback === 'function';

		this.acquire((err, client) => {
			if (err) {
				if (callerHasCallback) {
					callerCallback(err);
				}
				return;
			}

			// We pass everything except the user's final callback
			const invokeArgs = [client].concat(
				args.slice(0, callerHasCallback ? -1 : undefined)
			);
			// then the final callback after we release the resource
			invokeArgs.push((...cbArgs) => {
				this.release(client);
				if (callerHasCallback) {
					callerCallback(...cbArgs);
				}
			});

			decorated(...invokeArgs);
		}, priority);
	};
};

Pool.prototype.getPoolSize = function getPoolSize() {
	return this._count;
};

Pool.prototype.getName = function getName() {
	return this._factory.name;
};

Pool.prototype.availableObjectsCount = function availableObjectsCount() {
	return this._availableObjects.length;
};

Pool.prototype.inUseObjectsCount = function inUseObjectsCount() {
	return this._inUseObjects.length;
};

Pool.prototype.waitingClientsCount = function waitingClientsCount() {
	return this._waitingClients.size();
};

Pool.prototype.getMaxPoolSize = function getMaxPoolSize() {
	return this._factory.max;
};

Pool.prototype.getMinPoolSize = function getMinPoolSize() {
	return this._factory.min;
};

module.exports = { Pool };
