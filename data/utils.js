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

export function deep_copy(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        const copy = [];
        for (let i = 0; i < obj.length; i++) {
            copy[i] = deep_copy(obj[i]);
        }
        return copy;
    }

    const copy = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            copy[key] = deep_copy(obj[key]);
        }
    }
    return copy;
}