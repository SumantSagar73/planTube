const onlineUsers = new Map(); // userId -> Set of socketIds

const markUserOnline = (userId, socketId) => {
    if (!userId || !socketId) return 0;

    if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
    }

    const sockets = onlineUsers.get(userId);
    sockets.add(socketId);
    return sockets.size;
};

const markUserOffline = (userId, socketId) => {
    if (!userId || !socketId) return 0;

    const sockets = onlineUsers.get(userId);
    if (!sockets) return 0;

    sockets.delete(socketId);
    if (sockets.size === 0) {
        onlineUsers.delete(userId);
        return 0;
    }

    return sockets.size;
};

const getOnlineUserIds = () => Array.from(onlineUsers.keys());

const getOnlineUsersSnapshot = () => Array.from(onlineUsers.entries()).map(([userId, sockets]) => ({
    userId,
    connectionCount: sockets.size
}));

module.exports = {
    markUserOnline,
    markUserOffline,
    getOnlineUserIds,
    getOnlineUsersSnapshot
};