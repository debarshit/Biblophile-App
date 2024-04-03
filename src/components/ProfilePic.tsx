import React from 'react';
import {StyleSheet, Image, View, TouchableOpacity} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {COLORS, SPACING} from '../theme/theme';

const ProfilePic = ({navigation}: any) => {
  navigation = useNavigation();
  return (
    <TouchableOpacity onPress={()=>navigation.navigate("Settings")}>
      <View style={styles.ImageContainer}>
        <Image
          source={require('../assets/app_images/avatar.png')}
          style={styles.Image}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  ImageContainer: {
    height: SPACING.space_36,
    width: SPACING.space_36,
    borderRadius: SPACING.space_12,
    borderWidth: 2,
    borderColor: COLORS.secondaryDarkGreyHex,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  Image: {
    height: SPACING.space_36,
    width: SPACING.space_36,
  },
});

export default ProfilePic;
