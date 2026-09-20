import React, { useState, useEffect, useMemo } from "react";
import { Image, StyleSheet, TouchableOpacity } from "react-native";
import requests from "../../../services/requests";
import instance from "../../../services/axios";
import { COLORS } from "../../../theme/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../contexts/ThemeContext";

interface BannerItem {
  smallImage: string;
  title: string;
  description: string;
  link?: { text: string; url: string };
}

const Banner: React.FC = ( navigation: any) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [bannerItems, setBannerItems] = useState<BannerItem[]>([]);
  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  navigation = useNavigation();
  
  useEffect(() => {
    const fetchBannerData = async () => {
      try {
        const bannerResponse = await instance.get(requests.fetchBannerData);
        setBannerItems(bannerResponse.data.data);
      } catch (error) {
        console.error("Error fetching banner data:", error);
      }
    };

    fetchBannerData();

    const intervalId = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % bannerItems.length);
    }, 5000); // Change banner every 5 seconds

    return () => clearInterval(intervalId);
  }, [bannerItems.length]);

  const currentBanner = bannerItems[currentIndex];
  if (!currentBanner) {
    return null;
  }

  const { smallImage, link } = currentBanner;

  const imageSource = smallImage;

  const handleBannerClick = () => {
    if (link?.url) {
      navigation.navigate("CommonWebView", { url: link.url });
    }
  };

  return (
    <TouchableOpacity style={styles.bannerContainer} onPress={handleBannerClick}>
      <Image
        source={{ uri: imageSource }}
        style={styles.bannerImage}
        resizeMode="cover"
      />
      <LinearGradient
        colors={[COLORS.primaryBlackRGBA, COLORS.primaryBlackHex]}
        style={styles.bannerFadeBottom}
      />
    </TouchableOpacity>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  bannerContainer: {
    marginHorizontal: 16,
    marginVertical: 10,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  bannerFadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
});

export default Banner;
