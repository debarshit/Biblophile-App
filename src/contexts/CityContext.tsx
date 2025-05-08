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
    const fetchCityAndCoords = async () => {
      try {
        const ipApiResponse = await fetch('https://ipwho.is/');
        const ipData = await ipApiResponse.json();

        if (!selectedCity || selectedCity === 'Other') {
          setSelectedCity(ipData.city);
        }

        setCoordinates(ipData.latitude, ipData.longitude);
      } catch (error) {
        console.error("Error fetching user city:", error);
      }
    };
  
    fetchCityAndCoords();
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