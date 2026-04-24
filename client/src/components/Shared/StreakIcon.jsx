import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const StreakIcon = ({ size = 24, style = {}, color }) => {
  return (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
      <DotLottieReact
        src="https://lottie.host/69c5a69c-5299-4c35-a06b-e8991d6c17a9/hFZ7HRArQX.lottie"
        loop
        autoplay
        speed={0.8}
      />
    </div>
  );
};

export default StreakIcon;
