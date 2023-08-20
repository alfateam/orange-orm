class AxiosInterceptorManager {
	constructor() {
		this.requestInterceptors = [];
		this.responseInterceptors = [];
	}

	setInstance(instance) {
		this.requestInterceptors.forEach(interceptor => {
			instance.interceptors.request.use(interceptor.fulfilled, interceptor.rejected);
		});

		this.responseInterceptors.forEach(interceptor => {
			instance.interceptors.response.use(interceptor.fulfilled, interceptor.rejected);
		});
	}

	addRequestInterceptor(fulfilled, rejected) {
		this.requestInterceptors.push({ fulfilled, rejected });
	}

	addResponseInterceptor(fulfilled, rejected) {
		this.responseInterceptors.push({ fulfilled, rejected });
	}
}

module.exports = function create() {
	return new AxiosInterceptorManager();
};