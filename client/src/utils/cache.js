export const cache = {
    get: (key) => {
        try {
            const item = localStorage.getItem(key);
            if (!item) return null;

            const record = JSON.parse(item);
            const now = new Date().getTime();

            // 24 Hour TTL by default if not specified in set, or check record.expiry
            if (now > record.expiry) {
                localStorage.removeItem(key);
                return null;
            }

            return record.value;
        } catch (e) {
            return null;
        }
    },

    set: (key, value, ttlMinutes = 1440) => { // 24 hours default
        try {
            const now = new Date().getTime();
            const record = {
                value: value,
                expiry: now + (ttlMinutes * 60 * 1000)
            };
            localStorage.setItem(key, JSON.stringify(record));
        } catch (e) {
            console.warn('LocalStorage full or disabled', e);
        }
    },

    remove: (key) => {
        localStorage.removeItem(key);
    },

    clearPattern: (pattern) => {
        Object.keys(localStorage).forEach(key => {
            if (key.includes(pattern)) {
                localStorage.removeItem(key);
            }
        });
    }
};
