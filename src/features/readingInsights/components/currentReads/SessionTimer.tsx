import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS, FONTFAMILY, FONTSIZE } from '../../../../theme/theme';

const SessionTimer = ({ timer }) => {
  const [showTimerTooltip, setShowTimerTooltip] = useState(false);
  
  return (
    <View style={styles.timer}>
      <Text style={styles.greeting}>
        Reading session ongoing for: {Math.floor(timer / 60)} minutes {timer % 60} seconds
      </Text>
      <TouchableOpacity onPress={() => setShowTimerTooltip(!showTimerTooltip)} style={{ marginLeft: 8 }}>
        <FontAwesome name="info-circle" style={styles.infoIcon} />
        {showTimerTooltip && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>Updating your pages will stop the current reading session.</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  greeting: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryOrangeHex,
    textAlign: 'center',
  },
  infoIcon: {
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
  },
  tooltip: {
    position: 'absolute',
    right: 0,
    top: 20,
    backgroundColor: COLORS.primaryGreyHex,
    padding: 10,
    borderRadius: 5,
    width: 200,
    zIndex: 5,
  },
  tooltipText: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.primaryWhiteHex,
  },
});

export default SessionTimer;