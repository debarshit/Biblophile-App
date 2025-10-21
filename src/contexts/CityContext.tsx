import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useStore } from '../store/store';
import CityModal from '../features/bookshop/components/CityModal';

type CityContextType = {
  selectedCity: string | null;
  setSelectedCity: (city: string) => void;
  isCityModalOpen: boolean;
  setIsCityModalOpen: (isOpen: boolean) => void;
  latitude: number | null;
  longitude: number | null;
  setCoordinates: (lat: number, lng: number) => void;
};

const CityContext = createContext<CityContextType | undefined>(undefined);

export const CityProvider = ({ children }: { children: ReactNode }) => {
  const { selectedCity, setSelectedCity, latitude, longitude, setCoordinates } = useStore();
  const [isCityModalOpen, setIsCityModalOpen] = useState<boolean>(false);
  const [cityModalType, setCityModalType] = useState<'firstLaunch' | 'bangaloreDetected' | null>(null);

  useEffect(() => {
    const fetchCityAndCoords = async () => {
      try {
        const ipApiResponse = await fetch('https://ipwho.is/');
        const ipData = await ipApiResponse.json();
        const ipCity = ipData.city?.toLowerCase();
        const isInBangalore = ipCity === 'bengaluru' || ipCity === 'bangalore';

        setCoordinates(ipData.latitude, ipData.longitude);

        if (!selectedCity) {
          setCityModalType('firstLaunch');
          setIsCityModalOpen(true);
        } else if (selectedCity !== 'Bengaluru' && isInBangalore) {
          setCityModalType('bangaloreDetected');
          setIsCityModalOpen(true);
        } else {
          setIsCityModalOpen(false);
        }

      } catch (error) {
        console.error("Error fetching user city:", error);
      }
    };
  
    fetchCityAndCoords();
  }, []);

  return (
    <CityContext.Provider value={{ selectedCity, setSelectedCity, isCityModalOpen, setIsCityModalOpen, latitude, longitude, setCoordinates }}>
      {children}
      {isCityModalOpen && (
        <CityModal
          visibility={isCityModalOpen}
          onClose={() => setIsCityModalOpen(false)}
          modalType={cityModalType}
        />
      )}
    </CityContext.Provider>
  );
};

export const useCity = (): CityContextType => {
  const context = useContext(CityContext);
  if (context === undefined) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
};