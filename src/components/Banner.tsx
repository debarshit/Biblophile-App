import React, { useState, useEffect } from "react";
import { Image, StyleSheet, TouchableOpacity } from "react-native";
import requests from "../services/requests";
import instance from "../services/axios";
import { COLORS } from "../theme/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

interface BannerItem {
  smallImage: string;
  title: string;
  description: string;
  link?: { text: string; url: string };
}

interface BannerProps {
  opacity: number;
}

const Banner: React.FC<BannerProps> = ({ opacity }, navigation: any) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [bannerItems, setBannerItems] = useState<BannerItem[]>([]);

  navigation = useNavigation();
  
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
        style={[styles.bannerImage, { opacity }]}
        resizeMode="cover"
      />
      <LinearGradient
        colors={[COLORS.primaryBlackRGBA, COLORS.primaryBlackHex]}
        style={styles.bannerFadeBottom}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    width: '100%',
    // height: '25%', when banner outside scrollview in bg
    height: 200,
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
