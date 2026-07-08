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
  isFromIndia: boolean | null;
  detectedCity: string | null;
};

const CityContext = createContext<CityContextType | undefined>(undefined);

export const CityProvider = ({ children }: { children: ReactNode }) => {
  const { selectedCity, setSelectedCity, latitude, longitude, setCoordinates } = useStore();
  const [isCityModalOpen, setIsCityModalOpen] = useState<boolean>(false);
  const [cityModalType, setCityModalType] = useState<'firstLaunch' | 'bangaloreDetected' | null>(null);
  const [isFromIndia, setIsFromIndia] = useState<boolean | null>(null);
  const [detectedCity, setDetectedCity] = useState<string | null>(null);

  useEffect(() => {
    const fetchCityAndCoords = async () => {
      try {
        const ipApiResponse = await fetch('https://ipapi.co/json/');  //alt option: https://ipwho.is/
        const ipData = await ipApiResponse.json();
        const ipCity = ipData.city?.toLowerCase();
        const ipCountryCode = ipData.country;
        setDetectedCity(ipCity);
        if (!selectedCity) setSelectedCity(ipCity);
        const isFromIndia = ipCountryCode === 'IN';
        setIsFromIndia(isFromIndia);
        setCoordinates(ipData.latitude, ipData.longitude);

        if (!isFromIndia) {
          setIsCityModalOpen(false);
          return; 
        }

        const isInBangalore = ipCity.toLowerCase() === 'bengaluru' || ipCity.toLowerCase() === 'bangalore';

        if (!selectedCity) {
          setCityModalType('firstLaunch');
          setIsCityModalOpen(false);
        } else if (selectedCity !== 'Bengaluru' && isInBangalore) {
          setCityModalType('bangaloreDetected');
          setIsCityModalOpen(false);
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
    <CityContext.Provider value={{ selectedCity, setSelectedCity, isCityModalOpen, setIsCityModalOpen, latitude, longitude, setCoordinates, isFromIndia, detectedCity }}>
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