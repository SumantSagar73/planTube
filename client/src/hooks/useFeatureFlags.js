import { useSettings } from '../context/SettingsContext';

const useFeatureFlags = () => {
    const { flags, isEnabled, loading } = useSettings();
    return { flags, isEnabled, loading };
};

export default useFeatureFlags;
