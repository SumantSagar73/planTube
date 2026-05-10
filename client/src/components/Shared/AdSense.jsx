import React, { useEffect } from 'react';

/**
 * AdSense Component
 * 
 * Usage:
 * <AdSense 
 *   adSlot="your-ad-slot-id" 
 *   style={{ marginTop: '2rem' }} 
 * />
 * 
 * To respect user experience, ads are styled with clear margins and 
 * container-aware responsiveness.
 */
const AdSense = ({ 
    adClient = "ca-pub-4331601058269513", 
    adSlot, 
    adFormat = 'auto', 
    fullWidthResponsive = true, 
    style = {} 
}) => {
    useEffect(() => {
        // Only push if the script actually loaded
        if (window.adsbygoogle) {
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
                console.warn('AdSense push error (usually harmless):', e);
            }
        }

        return () => {
            // Cleanup to prevent "Failed to execute 'removeChild' on 'Node'" errors
            // when React unmounts but AdSense has modified the DOM structure.
            const containers = document.querySelectorAll('.adsense-container');
            containers.forEach(container => {
                container.innerHTML = '';
            });
        };
    }, []);

    // If no adSlot is provided, we don't render anything 
    // (unless you want to use Auto Ads, in which case the script in head is enough)
    if (!adSlot) return null;

    return (
        <div 
            className="adsense-container"
            style={{ 
                overflow: 'hidden', 
                minHeight: '100px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '12px',
                padding: '10px',
                textAlign: 'center',
                ...style 
            }}
        >
            <span style={{ 
                fontSize: '0.6rem', 
                color: 'var(--text-muted)', 
                display: 'block', 
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
            }}>
                Advertisement
            </span>
            <ins className="adsbygoogle"
                 style={{ display: 'block' }}
                 data-ad-client={adClient}
                 data-ad-slot={adSlot}
                 data-ad-format={adFormat}
                 data-full-width-responsive={fullWidthResponsive.toString()}></ins>
        </div>
    );
};

export default AdSense;
