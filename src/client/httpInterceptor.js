class InterceptorProxy {
	constructor() {
		this.requestInterceptors = [];
		this.responseInterceptors = [];
	}

	get request() {
		return {
			use: (onFulfilled, onRejected) => {
			const id = Math.random().toString(36).substring(2, 11); // unique id
				this.requestInterceptors.push({ id, onFulfilled, onRejected });
				return id;
			},
			eject: (id) => {
				this.requestInterceptors = this.requestInterceptors.filter(interceptor => interceptor.id !== id);
			}
		};
	}

	get response() {
		return {
			use: (onFulfilled, onRejected) => {
			const id = Math.random().toString(36).substring(2, 11); // unique id
				this.responseInterceptors.push({ id, onFulfilled, onRejected });
				return id;
			},
			eject: (id) => {
				this.responseInterceptors = this.responseInterceptors.filter(interceptor => interceptor.id !== id);
			}
		};
	}

	async applyRequest(config) {
		let result = Promise.resolve(config);
		for (const { onFulfilled, onRejected } of this.requestInterceptors) {
			result = result.then(onFulfilled, onRejected);
		}
		return await result;
	}

	async applyResponse(response) {
		let result = Promise.resolve(response);
		for (const { onFulfilled, onRejected } of this.responseInterceptors) {
			result = result.then(onFulfilled, onRejected);
		}
		return await result;
	}

	async applyResponseError(error) {
		let result = Promise.reject(error);
		for (const { onFulfilled, onRejected } of this.responseInterceptors) {
			result = result.then(onFulfilled, onRejected);
		}
		return await result;
	}
}

module.exports = function create() {
	return new InterceptorProxy();
};
