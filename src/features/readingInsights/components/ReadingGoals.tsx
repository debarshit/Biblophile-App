import { Dimensions, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import CustomPicker, { PickerOption } from '../../../components/CustomPickerComponent';
import { useAnalytics } from '../../../utils/analytics';

const goalTypeOptions: PickerOption[] = [
  { label: 'Books', value: 'books', icon: 'menu-book' },
  { label: 'Pages', value: 'pages', icon: 'menu' },
];

const ReadingGoals = () => {
  const analytics = useAnalytics();
  const userDetails = useStore((state: any) => state.userDetails);
  const userId = userDetails[0].userId;
  const token = userDetails[0].accessToken;

  const [state, setState] = useState({
    books: { goal: '', progress: 0 },
    pages: { goal: '', progress: 0 },
    activeType: 'books',
    isGoalSet: false,
    isFormVisible: false,
    isLoading: false,
    isResetting: false,
    error: null,
  });

  const activeGoal = state[state.activeType];
  const progressPercentage = activeGoal.goal && activeGoal.progress 
    ? Math.min((activeGoal.progress / activeGoal.goal) * 100, 100) : 0;
  const showGoalTypeSelector = state.isGoalSet && state.books.goal && state.pages.goal;
  const isGoalSet = state.isGoalSet && !state.isResetting;

  const updateState = (updates: Partial<typeof state>) => 
    setState(prev => ({ ...prev, ...updates }));

  const fetchGoalData = useCallback(async () => {
    if (state.isResetting || !userId) return;
    
    updateState({ isLoading: true, error: null });
    
    try {
      const [goalsRes, progressRes] = await Promise.all([
        instance.get(requests.fetchUserGoals, { headers: { Authorization: `Bearer ${token}` }}),
        instance.get(requests.fetchCurrentProgress, { headers: { Authorization: `Bearer ${token}` }})
      ]);
  
      const goals = goalsRes.data.data?.goals || {};
      const progress = progressRes.data.data || {};
      
      let activeType = 'books';
      if (!goals.booksGoal?.goal && goals.pagesGoal?.goal) activeType = 'pages';
      else if (goals.booksGoal?.goal && goals.pagesGoal?.goal) activeType = state.activeType;

      updateState({
        books: { goal: goals.booksGoal?.goal || '', progress: progress.progressBooks || 0 },
        pages: { goal: goals.pagesGoal?.goal || '', progress: Number(progress.progressPages) || 0 },
        activeType,
        isGoalSet: !!(goals.booksGoal?.goal || goals.pagesGoal?.goal),
        isLoading: false
      });
    } catch (error) {
      updateState({ error: `Failed to fetch data: ${error.message || 'Unknown error'}`, isLoading: false });
    }
  }, [state.isResetting, userId, state.activeType, token]);  

  const handleSubmit = async () => {
    const goalValue = activeGoal.goal;
    
    if (!goalValue || !userId) {
      updateState({ error: !userId ? 'User ID not found' : 'Please enter a valid goal' });
      return;
    }

    updateState({ isLoading: true, error: null });
    
    try {
      const res = await instance.post(requests.submitGoal, 
        { goal: goalValue, goalType: state.activeType },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      if (res.data.data?.message?.includes('successfully')) {
        updateState({ isFormVisible: false, isResetting: false });
        await fetchGoalData();
        analytics.track('goal_set');
      } else {
        throw new Error(res.data.data?.message || 'Failed to submit goal');
      }
    } catch (error) {
      updateState({ error: `Error: ${error.message || 'Unknown error'}`, isLoading: false });
    }
  };

  const handleReset = () => {
    updateState({
      books: { goal: '', progress: 0 },
      pages: { goal: '', progress: 0 },
      activeType: 'books',
      isGoalSet: false,
      isResetting: true,
      isFormVisible: true,
      error: null
    });
  };

  const handleCancel = () => {
    updateState({ isResetting: false, isFormVisible: false });
    fetchGoalData();
  };

  useEffect(() => {
    if (!state.isResetting && userId) fetchGoalData();
  }, [fetchGoalData, state.isResetting, userId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reading Goals (2025)</Text>
      
      {state.error && (
        <View style={styles.errorMessage}>
          <Text style={styles.errorText}>{state.error}</Text>
        </View>
      )}

      {!isGoalSet ? (
        !state.isFormVisible ? (
          <View style={styles.section}>
            <Text style={styles.promptText}>Set a reading goal for 2025</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => updateState({ isFormVisible: true })}>
              <Text style={styles.buttonText}>Set Goal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.label}>Type:</Text>
              <View style={styles.pickerWrapper}>
                <CustomPicker
                  options={goalTypeOptions}
                  selectedValue={state.activeType}
                  onValueChange={(value) => updateState({ activeType: value })}
                />
              </View>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Goal:</Text>
              <TextInput
                style={styles.input}
                value={String(activeGoal.goal)}
                onChangeText={(value) => updateState({ 
                  [state.activeType]: { ...activeGoal, goal: value }
                })}
                placeholder={`# of ${state.activeType}`}
                placeholderTextColor={COLORS.secondaryLightGreyHex}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.primaryButton, state.isLoading && styles.disabled]}
                onPress={handleSubmit}
                disabled={state.isLoading}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.secondaryButton, state.isLoading && styles.disabled]}
                onPress={handleCancel}
                disabled={state.isLoading}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      ) : (
        <View style={styles.section}>
          {showGoalTypeSelector && (
            <View style={styles.selectorWrapper}>
              <CustomPicker
                options={goalTypeOptions.filter(opt => state[opt.value].goal)}
                selectedValue={state.activeType}
                onValueChange={(value) => updateState({ activeType: value })}
              />
            </View>
          )}
          
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              <Text style={styles.progressBold}>{activeGoal.progress}</Text>
              /{activeGoal.goal} {state.activeType}
            </Text>
            <Text style={styles.progressPercent}>{Math.round(progressPercentage)}%</Text>
          </View>
          
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
          </View>
          
          <TouchableOpacity
            style={[styles.resetButton, state.isLoading && styles.disabled]}
            onPress={handleReset}
            disabled={state.isLoading}
          >
            <Text style={styles.resetText}>Reset Goal</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ReadingGoals;

const { width } = Dimensions.get('window');
const containerWidth = Math.min(380, width - SPACING.space_32);

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primaryDarkGreyHex,
    padding: SPACING.space_16,
    borderRadius: BORDERRADIUS.radius_10,
    width: containerWidth,
    alignSelf: 'center',
    margin: SPACING.space_16,
    shadowColor: COLORS.primaryBlackHex,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: FONTSIZE.size_18,
    marginBottom: SPACING.space_12,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    textAlign: 'center',
  },
  errorMessage: {
    backgroundColor: COLORS.primaryRedHex,
    padding: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_8,
    marginBottom: SPACING.space_8,
  },
  errorText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    textAlign: 'center',
  },
  section: {
    backgroundColor: COLORS.secondaryDarkGreyHex,
    padding: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_8,
  },
  promptText: {
    fontSize: FONTSIZE.size_14,
    marginBottom: SPACING.space_10,
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.space_10,
  },
  label: {
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    flex: 1,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  pickerWrapper: {
    flex: 2,
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    borderWidth: 1,
    borderColor: COLORS.primaryLightGreyHex,
  },
  input: {
    flex: 2,
    padding: SPACING.space_8,
    backgroundColor: COLORS.primaryGreyHex,
    color: COLORS.primaryWhiteHex,
    borderWidth: 1,
    borderColor: COLORS.primaryLightGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.space_10,
    gap: SPACING.space_8,
  },
  primaryButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    padding: SPACING.space_10,
    borderRadius: BORDERRADIUS.radius_8,
    flex: 1,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
  },
  secondaryButton: {
    backgroundColor: COLORS.primaryGreyHex,
    padding: SPACING.space_10,
    borderRadius: BORDERRADIUS.radius_8,
    borderWidth: 1,
    borderColor: COLORS.primaryLightGreyHex,
    flex: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.secondaryLightGreyHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
  },
  disabled: {
    opacity: 0.5,
  },
  selectorWrapper: {
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    borderWidth: 1,
    borderColor: COLORS.primaryLightGreyHex,
    width: 180,
    alignSelf: 'center',
    marginBottom: SPACING.space_10,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_8,
  },
  progressText: {
    fontSize: FONTSIZE.size_14,
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  progressBold: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_semibold,
  },
  progressPercent: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryOrangeHex,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    marginVertical: SPACING.space_8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_8,
  },
  resetButton: {
    backgroundColor: 'transparent',
    padding: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_8,
    borderWidth: 1,
    borderColor: COLORS.primaryLightGreyHex,
    alignSelf: 'center',
    marginTop: SPACING.space_4,
  },
  resetText: {
    color: COLORS.secondaryLightGreyHex,
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
  },
});