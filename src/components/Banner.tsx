import React, { useState, useEffect } from "react";
import { View, Image, StyleSheet } from "react-native";
import requests from "../services/requests";
import instance from "../services/axios";
import { COLORS } from "../theme/theme";
import { LinearGradient } from "expo-linear-gradient";

interface BannerItem {
  smallImage: string;
  title: string;
  description: string;
  link?: { text: string; url: string };
}

interface BannerProps {
  opacity: number;
}

const Banner: React.FC<BannerProps> = ({ opacity }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [bannerItems, setBannerItems] = useState<BannerItem[]>([]);

  useEffect(() => {
    const fetchBannerData = async () => {
      try {
        const bannerResponse = await instance.get(requests.fetchBannerData);
        setBannerItems(bannerResponse.data);
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

  const { smallImage } = currentBanner;

  const imageSource = smallImage;

  return (
    <View style={styles.bannerContainer}>
      <Image
        source={{ uri: imageSource }}
        style={[styles.bannerImage, { opacity }]}
        resizeMode="cover"
      />
      <LinearGradient
        colors={[COLORS.primaryBlackRGBA, COLORS.primaryBlackHex]}
        style={styles.bannerFadeBottom}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    width: '100%',
    height: '25%',
    position: 'absolute',
  },
  bannerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    objectFit: 'fill',
  },
  bannerFadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
  },
});

export default Banner;
