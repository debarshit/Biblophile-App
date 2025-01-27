import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/theme';
import { useNavigation } from '@react-navigation/native';

const FloatingIcon = ({navigation}: any) => {
    navigation = useNavigation();
    
    const onPressFAB = () => {
        navigation.navigate('Cart');
    };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.fab} onPress={onPressFAB}>
        <MaterialIcons name="shopping-cart" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    backgroundColor: COLORS.primaryOrangeHex,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, // Ensure it sits above other components
  },
});

export default FloatingIcon;
