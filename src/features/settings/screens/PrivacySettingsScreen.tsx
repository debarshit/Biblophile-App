import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import HeaderBar from "../../../components/HeaderBar";
import instance from "../../../services/axios";
import requests from "../../../services/requests";
import { useStore } from "../../../store/store";
import { useTheme } from "../../../contexts/ThemeContext";
import Toast from "react-native-toast-message";

const VISIBILITY_OPTIONS = [
  { label: "Only Me", value: "only_me" },
  { label: "Friends", value: "friends" },
  { label: "Followers", value: "followers" },
  { label: "Everyone", value: "everyone" },
];

const PrivacySettingsScreen = () => {
  const [settings, setSettings] = useState<any>(null);

  const userDetails = useStore((state: any) => state.userDetails);
  const accessToken = userDetails[0].accessToken;

  const { COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  useFocusEffect(
    useCallback(() => {
      fetchSettings();
    }, [])
  );

  const fetchSettings = async () => {
    try {
      const res = await instance.get(requests.getPrivacySettings, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      setSettings(res.data.data);
    } catch (err) {
      console.log("Failed to fetch privacy settings", err);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    // optimistic update
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));

    try {
      await instance.put(
        requests.updatePrivacySettings,
        { [key]: value },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      Toast.show({
        type: "success",
        text1: "Updated successfully",
      });
    } catch (err) {
      console.log("Update failed", err);
    }
  };

  const renderOptions = (selectedValue, onChange) => {
    return (
      <View style={styles.optionRow}>
        {VISIBILITY_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.optionButton,
              selectedValue === opt.value && styles.optionActive,
            ]}
            onPress={() => onChange(opt.value)}
          >
            <Text style={styles.optionText}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (!settings) return null;

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar title="Privacy Settings" showBackButton />

      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.title}>Profile Visibility</Text>
          <Text style={styles.subtitle}>
            Who can see your profile and activity
          </Text>

          {renderOptions(settings.profileVisibility, (val) =>
            updateSetting("profileVisibility", val)
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Default Shelf Visibility</Text>
          <Text style={styles.subtitle}>
            Applies to all shelves unless changed manually
          </Text>

          {renderOptions(settings.defaultShelfVisibility, (val) =>
            updateSetting("defaultShelfVisibility", val)
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Default Book Visibility</Text>
          <Text style={styles.subtitle}>
            Applies to all books unless changed manually
          </Text>

          {renderOptions(settings.defaultBookVisibility, (val) =>
            updateSetting("defaultBookVisibility", val)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.primaryBlackHex,
    },
    section: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.primaryGreyHex,
    },
    title: {
      fontSize: 18,
      color: COLORS.primaryWhiteHex,
      fontWeight: "600",
    },
    subtitle: {
      fontSize: 14,
      color: COLORS.secondaryLightGreyHex,
      marginBottom: 10,
    },
    optionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    optionButton: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 10,
      backgroundColor: COLORS.primaryGreyHex,
    },
    optionActive: {
      borderWidth: 1,
      borderColor: COLORS.primaryWhiteHex,
    },
    optionText: {
      color: COLORS.primaryWhiteHex,
    },
});

export default PrivacySettingsScreen;