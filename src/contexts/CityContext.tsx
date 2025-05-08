import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useStore } from '../store/store';

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

  useEffect(() => {
    // Only fetch city if it's not already set
    const fetchCity = async () => {
      if (!selectedCity) {
        try {
          const ipApiResponse = await fetch('https://freeipapi.com/api/json/');
          const ipData = await ipApiResponse.json();
          setSelectedCity(ipData.cityName);
          setCoordinates(ipData.latitude, ipData.longitude);
          console.log('user city', ipData.cityName);
        } catch (error) {
          console.error("Error fetching user city:", error);
          setSelectedCity("Other");
        }
      }
    };
    
    fetchCity();
  }, []);

  return (
    <CityContext.Provider value={{ selectedCity, setSelectedCity, isCityModalOpen, setIsCityModalOpen, latitude, longitude, setCoordinates }}>
      {children}
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