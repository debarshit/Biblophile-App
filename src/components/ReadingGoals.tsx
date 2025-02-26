import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import instance from '../services/axios';
import requests from '../services/requests';
import { useStore } from '../store/store';
import { Picker } from '@react-native-picker/picker';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';

const ReadingGoals = () => {
    const [goalState, setGoalState] = useState({
        books: { goal: '', progress: 0 },
        pages: { goal: '', progress: 0 },
        activeType: 'books',
        isGoalSet: false,
    });

    const [uiState, setUiState] = useState({
        isFormVisible: false,
        isLoading: true,
        isResetting: false,
        error: null,
    });

  const userDetails = useStore((state: any) => state.userDetails);
  const userId = userDetails[0].userId;

  // Derived state
  const isGoalSet = goalState.isGoalSet && !uiState.isResetting;
  const activeGoal = goalState[goalState.activeType];
  const progressPercentage = activeGoal.goal && activeGoal.progress 
    ? Math.min((activeGoal.progress / activeGoal.goal) * 100, 100) 
    : 0;
  const showGoalTypeSelector = isGoalSet && goalState.books.goal && goalState.pages.goal;

  // Event handlers
  const handleGoalChange = (value) => {
    setGoalState(prev => ({
      ...prev,
      [prev.activeType]: { ...prev[prev.activeType], goal: value }
    }));
  };
  
  const handleGoalTypeChange = (value) => {
    setGoalState(prev => ({
      ...prev,
      activeType: value
    }));
  };

  const toggleGoalForm = () => {
    setUiState(prev => ({
      ...prev,
      isFormVisible: !prev.isFormVisible
    }));
  };

  // API operations
  const fetchGoalData = useCallback(async () => {
    if (uiState.isResetting || !userId) return;
    
    setUiState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const [goalsResponse, progressResponse] = await Promise.all([
        instance.get(`${requests.fetchUserGoals}${userId}`),
        instance.get(`${requests.fetchCurrentProgress}${userId}`)
      ]);
  
      // Process data
      const goalsData = goalsResponse.data?.goals || {};
      const progressData = progressResponse.data || {};
      
      // Determine active goal type
      let activeType = 'books';
      if (!goalsData.booksGoal?.Goal && goalsData.pagesGoal?.Goal) {
        activeType = 'pages';
      } else if (goalsData.booksGoal?.Goal && goalsData.pagesGoal?.Goal) {
        activeType = goalState.activeType;
      }

      setGoalState({
        books: { 
          goal: goalsData.booksGoal?.Goal || '', 
          progress: progressData.progressBooks || 0 
        },
        pages: { 
          goal: goalsData.pagesGoal?.Goal || '', 
          progress: progressData.progressPages || 0 
        },
        activeType,
        isGoalSet: !!(goalsData.booksGoal?.Goal || goalsData.pagesGoal?.Goal)
      });
    } catch (error) {
      setUiState(prev => ({ 
        ...prev, 
        error: `Failed to fetch data: ${error.message || 'Unknown error'}` 
      }));
    } finally {
      setUiState(prev => ({ ...prev, isLoading: false }));
    }
  }, [uiState.isResetting, userId, goalState.activeType]);  

  const handleSubmit = async () => {
    const goalToSubmit = goalState[goalState.activeType].goal;
    
    if (!goalToSubmit || !userId) {
      setUiState(prev => ({ 
        ...prev, 
        error: !userId ? 'User ID not found' : 'Please enter a valid goal' 
      }));
      return;
    }

    setUiState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await instance.post(requests.submitGoal, { 
        userId, 
        goal: goalToSubmit, 
        goalType: goalState.activeType 
      });
      
      if (response.data?.success) {
        setUiState(prev => ({ 
          ...prev, 
          isFormVisible: false, 
          isResetting: false 
        }));
        await fetchGoalData();
      } else {
        throw new Error(response.data?.message || 'Failed to submit goal');
      }
    } catch (error) {
      setUiState(prev => ({ 
        ...prev, 
        error: `Error submitting goal: ${error.message || 'Unknown error'}` 
      }));
    } finally {
      setUiState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleReset = () => {
    setUiState(prev => ({ 
      ...prev, 
      isResetting: true, 
      isFormVisible: true, 
      error: null 
    }));
    
    setGoalState(prev => ({
      books: { goal: '', progress: 0 },
      pages: { goal: '', progress: 0 },
      activeType: 'books',
      isGoalSet: false
    }));
  };

  const handleCancel = () => {
    setUiState(prev => ({ 
      ...prev, 
      isResetting: false, 
      isFormVisible: false 
    }));
    fetchGoalData();
  };

  // Effects
  useEffect(() => {
    if (!uiState.isResetting && userId) {
      fetchGoalData();
    }
  }, [fetchGoalData, uiState.isResetting, userId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reading Goals(2025)</Text>
      
      {uiState.isLoading && (
        <View style={styles.loadingIndicator}>
          <ActivityIndicator color={COLORS.primaryOrangeHex} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
      
      {uiState.error && (
        <View style={styles.errorMessage}>
          <Text style={styles.errorText}>{uiState.error}</Text>
        </View>
      )}

      {!isGoalSet ? (
        <>
          {!uiState.isFormVisible ? (
            <View style={styles.goalPrompt}>
              <Text style={styles.promptText}>Set a reading goal for 2025</Text>
              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={toggleGoalForm}
              >
                <Text style={styles.buttonText}>Set Goal</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.goalForm}>
              <View style={styles.formRow}>
                <Text style={styles.label}>Goal type:</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    style={styles.picker}
                    selectedValue={goalState.activeType}
                    onValueChange={handleGoalTypeChange}
                    dropdownIconColor={COLORS.primaryWhiteHex}
                    mode="dropdown"
                  >
                    <Picker.Item label="Books" value="books" />
                    <Picker.Item label="Pages" value="pages" />
                  </Picker>
                </View>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.label}>Your goal:</Text>
                <TextInput
                  style={styles.input}
                  value={String(activeGoal.goal)}
                  onChangeText={handleGoalChange}
                  placeholder={`# of ${goalState.activeType}`}
                  placeholderTextColor={COLORS.secondaryLightGreyHex}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={[
                    styles.primaryButton, 
                    uiState.isLoading && styles.disabledButton
                  ]}
                  onPress={handleSubmit}
                  disabled={uiState.isLoading}
                >
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.secondaryButton, 
                    uiState.isLoading && styles.disabledButton
                  ]}
                  onPress={handleCancel}
                  disabled={uiState.isLoading}
                >
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      ) : (
        <View style={styles.progressSection}>
          {showGoalTypeSelector && (
            <View style={styles.goalSelector}>
              <View style={styles.compactPickerContainer}>
                <Picker
                  style={styles.compactPicker}
                  selectedValue={goalState.activeType}
                  onValueChange={handleGoalTypeChange}
                  dropdownIconColor={COLORS.primaryWhiteHex}
                  mode="dropdown"
                >
                  {goalState.books.goal && <Picker.Item label="Books Goal" value="books" />}
                  {goalState.pages.goal && <Picker.Item label="Pages Goal" value="pages" />}
                </Picker>
              </View>
            </View>
          )}
          
          <View style={styles.progressDisplay}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressFraction}>
                <Text style={styles.progressNumber}>{activeGoal.progress}</Text>
                /{activeGoal.goal} {goalState.activeType}
              </Text>
              <Text style={styles.progressPercent}>
                {Math.round(progressPercentage)}%
              </Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${progressPercentage}%` }
                ]}
              />
            </View>
            
            <TouchableOpacity
              style={[
                styles.resetButton,
                uiState.isLoading && styles.disabledButton
              ]}
              onPress={handleReset}
              disabled={uiState.isLoading}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
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
    padding: SPACING.space_20,
    borderRadius: BORDERRADIUS.radius_10,
    width: containerWidth,
    alignSelf: 'center',
    margin: SPACING.space_24,
    shadowColor: COLORS.primaryBlackHex,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: FONTSIZE.size_20,
    marginBottom: SPACING.space_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    textAlign: 'center',
  },
  loadingIndicator: {
    backgroundColor: COLORS.secondaryDarkGreyHex,
    padding: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_8,
    marginBottom: SPACING.space_12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONTSIZE.size_14,
    color: COLORS.secondaryLightGreyHex,
    marginLeft: SPACING.space_8,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  errorMessage: {
    backgroundColor: COLORS.primaryRedHex,
    padding: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_8,
    marginBottom: SPACING.space_12,
  },
  errorText: {
    color: COLORS.primaryWhiteHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
    textAlign: 'center',
  },
  goalPrompt: {
    backgroundColor: COLORS.secondaryDarkGreyHex,
    padding: SPACING.space_16,
    borderRadius: BORDERRADIUS.radius_8,
    margin: SPACING.space_12,
    alignItems: 'center',
  },
  promptText: {
    fontSize: FONTSIZE.size_16,
    marginBottom: SPACING.space_12,
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  goalForm: {
    backgroundColor: COLORS.secondaryDarkGreyHex,
    padding: SPACING.space_16,
    borderRadius: BORDERRADIUS.radius_8,
    margin: SPACING.space_12,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.space_12,
  },
  label: {
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    flex: 1,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  pickerContainer: {
    flex: 2,
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    borderWidth: 1,
    borderColor: COLORS.primaryLightGreyHex,
    overflow: 'hidden',
  },
  picker: {
    color: COLORS.primaryWhiteHex,
    height: 50,
    width: '100%',
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
    marginTop: SPACING.space_16,
  },
  primaryButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    padding: SPACING.space_10,
    borderRadius: BORDERRADIUS.radius_8,
    flex: 1,
    marginHorizontal: SPACING.space_4,
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
    marginHorizontal: SPACING.space_4,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.secondaryLightGreyHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
  },
  disabledButton: {
    opacity: 0.5,
  },
  progressSection: {
    padding: SPACING.space_12,
  },
  goalSelector: {
    marginBottom: SPACING.space_12,
    alignItems: 'center',
  },
  compactPickerContainer: {
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    borderWidth: 1,
    borderColor: COLORS.primaryLightGreyHex,
    width: 200,
    overflow: 'hidden',
  },
  compactPicker: {
    color: COLORS.primaryWhiteHex,
  },
  progressDisplay: {
    backgroundColor: COLORS.secondaryDarkGreyHex,
    padding: SPACING.space_16,
    borderRadius: BORDERRADIUS.radius_8,
    margin: SPACING.space_12,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.space_12,
  },
  progressFraction: {
    fontSize: FONTSIZE.size_14,
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  progressNumber: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_semibold,
  },
  progressPercent: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryOrangeHex,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    marginVertical: SPACING.space_12,
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
    marginTop: SPACING.space_12,
  },
  resetButtonText: {
    color: COLORS.secondaryLightGreyHex,
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_regular,
  },
});