// MonthlyWrapScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Image, TouchableOpacity, Share, Platform, Text, ActivityIndicator, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system';
// import * as MediaLibrary from 'expo-media-library';
import { useStore } from '../../../store/store';
import instance from '../../../services/axios';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import { Ionicons } from '@expo/vector-icons';

const MonthlyWrapScreen = ({ route }) => {
  const { month, year } = route.params;
  const [wrap, setWrap] = useState(null);
  const [loading, setLoading] = useState(true);
  const userDetails = useStore(state => state.userDetails);

  useEffect(() => {
    fetchWrap();
  }, []);

  const fetchWrap = async () => {
    try {
      const response = await instance.get('/monthly-wrap', {
        params: { month, year },
        headers: { Authorization: `Bearer ${userDetails[0].accessToken}` }
      });
      
      setWrap(response.data.data);
    } catch (error) {
      console.error('Failed to fetch wrap:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my ${month} reading wrap!`,
        url: wrap.imageUrl, // For iOS
      });

      // Track share
      await instance.post('/monthly-wrap/share', {
        wrapId: wrap.wrapId,
        platform: Platform.OS
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleDownload = async () => {
    try {
      // const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission needed to save image');
        return;
      }

      const fileUri = FileSystem.documentDirectory + `wrap-${month}-${year}.png`;
      const downloadResult = await FileSystem.downloadAsync(wrap.imageUrl, fileUri);
      
      // await MediaLibrary.saveToLibraryAsync(downloadResult.uri);
      
      // Track download
      await instance.post('/monthly-wrap/download', {
        wrapId: wrap.wrapId
      });

      alert('Saved to gallery!');
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: wrap.imageUrl }}
        style={styles.wrapImage}
        resizeMode="contain"
      />

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="share-social" size={24} />
          <Text style={styles.actionText} >Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
          <Ionicons name="download" size={24} />
          <Text style={styles.actionText} >Download</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MonthlyWrapScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
    padding: SPACING.space_16,
    justifyContent: 'space-between',
  },

  wrapImage: {
    width: '100%',
    height: '75%',
    borderRadius: BORDERRADIUS.radius_15,
    backgroundColor: COLORS.primaryDarkGreyHex,
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.space_20,
    gap: SPACING.space_12,
  },

  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_10,
    backgroundColor: COLORS.primaryOrangeHex,
    gap: SPACING.space_8,
  },

  actionText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_semibold,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
    alignItems: 'center',
    justifyContent: 'center',
  },
})