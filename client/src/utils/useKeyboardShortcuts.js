import { useEffect, useRef } from 'react';

/**
 * Keyboard shortcuts for PlanTube Focus Mode.
 * Uses a ref to ensure we always call the latest functions without
 * constantly detaching and attaching the global event listener.
 */
const useKeyboardShortcuts = (handlers) => {
    const handlersRef = useRef(handlers);

    // Update the ref to the latest handlers on every render
    useEffect(() => {
        handlersRef.current = handlers;
    });

    useEffect(() => {
        const handler = (e) => {
            // Don't fire when user is typing in an input
            const tag = document.activeElement?.tagName?.toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
            if (document.activeElement?.isContentEditable) return;

            // Ignore when modifier keys (except Shift) are held
            if (e.ctrlKey || e.altKey || e.metaKey) return;

            const {
                togglePlay, seekRelative, adjustVolume, toggleMute,
                toggleFullscreen, toggleZenMode, toggleComplete,
                nextVideo, prevVideo, cycleSpeedUp, cycleSpeedDown,
                requestPiP, toggleShortcutsHelp
            } = handlersRef.current;

            switch (e.key) {
                // Play / Pause
                case ' ':
                case 'k':
                    e.preventDefault();
                    togglePlay?.();
                    break;

                // Seek backward
                case 'ArrowLeft':
                case 'j':
                    e.preventDefault();
                    seekRelative?.(-10);
                    break;

                // Seek forward
                case 'ArrowRight':
                case 'l':
                    e.preventDefault();
                    seekRelative?.(10);
                    break;

                // Volume up
                case 'ArrowUp':
                    e.preventDefault();
                    adjustVolume?.(10);
                    break;

                // Volume down
                case 'ArrowDown':
                    e.preventDefault();
                    adjustVolume?.(-10);
                    break;

                // Mute / Unmute
                case 'm':
                    e.preventDefault();
                    toggleMute?.();
                    break;

                // Fullscreen
                case 'f':
                    e.preventDefault();
                    toggleFullscreen?.();
                    break;

                // Zen Mode
                case 'z':
                    e.preventDefault();
                    toggleZenMode?.();
                    break;

                // Mark Complete
                case 'c':
                    e.preventDefault();
                    toggleComplete?.();
                    break;

                // Next video
                case 'N':
                    if (e.shiftKey) { e.preventDefault(); nextVideo?.(); }
                    break;

                // Previous video
                case 'P':
                    if (e.shiftKey) { e.preventDefault(); prevVideo?.(); }
                    break;

                // Speed up (allow with or without shift)
                case '>':
                case '.':
                    e.preventDefault();
                    cycleSpeedUp?.();
                    break;

                // Speed down (allow with or without shift)
                case '<':
                case ',':
                    e.preventDefault();
                    cycleSpeedDown?.();
                    break;

                // Picture-in-Picture
                case 'p':
                    e.preventDefault();
                    requestPiP?.();
                    break;

                // Help overlay
                case '?':
                    e.preventDefault();
                    toggleShortcutsHelp?.();
                    break;

                default:
                    break;
            }
        };

        // Attach listener exactly once
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);
};

export default useKeyboardShortcuts;
