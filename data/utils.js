const TIME_BETWEEN_REQUESTS = 1300;

export function api_call(url) {
	return new Promise((resolve, reject) => {
		setTimeout(async () => {
			try {
				const data = await fetch(url);
				resolve(data);
			}catch(e) {
				reject(e);
			}
		}, TIME_BETWEEN_REQUESTS);
	});
}