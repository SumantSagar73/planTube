const DEFAULT_TIME_ZONE = 'UTC';

const getStoredUser = () => {
    try {
        const raw = localStorage.getItem('user');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export const getUserTimeZone = (explicitTimeZone) => {
    const storedUser = getStoredUser();
    const candidate = explicitTimeZone
        || storedUser?.preferences?.timezone
        || storedUser?.timezone
        || '';

    if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
    }

    return DEFAULT_TIME_ZONE;
};

const toDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDateTime = (value, options = {}) => {
    const date = toDate(value);
    if (!date) return '-';

    const locale = options.locale || undefined;
    const timeZone = getUserTimeZone(options.timeZone);

    return new Intl.DateTimeFormat(locale, {
        timeZone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...(options.hour12 === undefined ? {} : { hour12: options.hour12 })
    }).format(date);
};

export const formatDate = (value, options = {}) => {
    const date = toDate(value);
    if (!date) return '-';

    const locale = options.locale || undefined;
    const timeZone = getUserTimeZone(options.timeZone);

    return new Intl.DateTimeFormat(locale, {
        timeZone,
        year: options.year || undefined,
        month: options.month || 'short',
        day: options.day || 'numeric',
        weekday: options.weekday,
        ...(options.includeTime
            ? { hour: '2-digit', minute: '2-digit' }
            : {})
    }).format(date);
};

export const formatMonthYear = (value, options = {}) => {
    const date = toDate(value);
    if (!date) return '-';

    const locale = options.locale || undefined;
    const timeZone = getUserTimeZone(options.timeZone);

    return new Intl.DateTimeFormat(locale, {
        timeZone,
        month: 'long',
        year: 'numeric'
    }).format(date);
};