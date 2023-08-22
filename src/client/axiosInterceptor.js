class InterceptorProxy {
	constructor() {
		this.requestInterceptors = [];
		this.responseInterceptors = [];
	}

	get request() {
		return {
			use: (onFulfilled, onRejected) => {
				const id = Math.random().toString(36).substr(2, 9); // unique id
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
				const id = Math.random().toString(36).substr(2, 9); // unique id
				this.responseInterceptors.push({ id, onFulfilled, onRejected });
				return id;
			},
			eject: (id) => {
				this.responseInterceptors = this.responseInterceptors.filter(interceptor => interceptor.id !== id);
			}
		};
	}

	applyTo(axiosInstance) {
		for (const { onFulfilled, onRejected } of this.requestInterceptors) {
			axiosInstance.interceptors.request.use(onFulfilled, onRejected);
		}

		for (const { onFulfilled, onRejected } of this.responseInterceptors) {
			axiosInstance.interceptors.response.use(onFulfilled, onRejected);
		}
	}
}

module.exports = function create() {
	return new InterceptorProxy();
};