import { useState, useEffect } from 'react';
import socket from '../services/socket';

const useFocusModeSocket = (video, user) => {
    const [presenceCount, setPresenceCount] = useState(0);

    useEffect(() => {
        if (!video) return;

        const youtubeId = video.sharedVideo?.youtubeId || video.videoId;
        if (!youtubeId) return;

        if (!socket.connected) {
            socket.connect();
        }

        let visitorId = sessionStorage.getItem('visitor_id');
        if (!visitorId) {
            visitorId = 'vis_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('visitor_id', visitorId);
        }

        socket.emit('join_video', {
            videoId: youtubeId,
            userId: user?._id,
            visitorId: !user ? visitorId : null
        });

        const handlePresenceUpdate = (data) => {
            if (data.videoId === youtubeId) {
                setPresenceCount(data.count);
            }
        };

        socket.on('presence_update', handlePresenceUpdate);

        socket.on('connect', () => {
            socket.emit('join_video', {
                videoId: youtubeId,
                userId: user?._id,
                visitorId: !user ? visitorId : null
            });
        });

        return () => {
            socket.emit('leave_video', { videoId: youtubeId });
            socket.off('presence_update', handlePresenceUpdate);
            socket.off('connect');
        };
    }, [video, user]);

    return { presenceCount };
};

export default useFocusModeSocket;
