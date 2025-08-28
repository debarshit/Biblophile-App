import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StarRating from 'react-native-star-rating-widget';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { WysiwygEditor } from '../../../components/WysiwygEditor';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS } from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';

interface SubmitReviewScreenProps {
  route: any;
  navigation: any;
}

const EMOTIONS = [
  { emotionId: 1, emotion: "Joy" },
  { emotionId: 2, emotion: "Sadness" },
  { emotionId: 3, emotion: "Fear" },
  { emotionId: 4, emotion: "Anger" },
  { emotionId: 5, emotion: "Surprise" },
  { emotionId: 6, emotion: "Anticipation" },
  { emotionId: 7, emotion: "Nostalgia" },
  { emotionId: 8, emotion: "Empathy" },
];

const TAG_CATEGORIES = {
  characters: ['believable', 'change and grow', 'diverse representation', 'feel distant', 'flat', 'formulaic', 'inconsistent', 'lack of diversity', 'likeable', 'limited character growth', 'memorable', 'minor characters stand out', 'morally ambiguous', 'multilayered', 'one-dimensional', 'original', 'relatable', 'strong relationships', 'strong villain', 'unengaging', 'unforgettable protagonist', 'unlikable'],
  plot: ['action-packed', 'addictive', 'clever plotting', 'clichéd', 'confusing', 'disjointed', 'epic scope', 'fast-paced', 'gripping/exciting', 'loose ends', 'nonlinear narrative', 'plot holes', 'predictable', 'predictable but satisfying', 'repetitive', 'rushed', 'satisfying conclusion', 'slow-paced', 'slow start, strong finish', 'steady pacing', 'suspenseful', 'twisty', 'uneven pacing', 'unpredictable', 'unrealistic', 'unsatisfying conclusion', 'well-structured'],
  setting: ['ancient', 'atmospheric', 'beautiful', 'bland/generic', 'bleak', 'dark', 'dystopian', 'eerie', 'enchanted', 'ethereal', 'evocative imagery', 'expansive', 'forgettable', 'futuristic', 'gritty', 'harsh', 'historical', 'idyllic', 'immersive world-building', 'innovative', 'lack of depth', 'lush', 'magical', 'majestic', 'mysterious', 'mystical', 'nostalgic', 'opulent', 'otherworldly', 'picturesque', 'realistic', 'rustic', 'setting fits the story', 'surreal', 'unique location', 'vivid descriptions'],
  writingStyle: ['bad writing', 'beautifully-written', 'boring prose', 'clear but uninspired', 'clunky', 'dense', 'descriptive', 'easy to read', 'flowery/lush', 'funny', 'hard to follow', 'original', 'repetitive', 'simplistic', 'straightforward', 'takes getting used to', 'whimsical tone', 'witty'],
  contentWarnings: ['ableism', 'abuse', 'animal abuse', 'bigotry', 'child abuse', 'child loss', 'death', 'domestic violence', 'eating disorders', 'explicit sexual content', 'fat phobia', 'grief', 'homophobia', 'misogyny', 'murder', 'racism', 'religious intolerance', 'self-harm', 'sexual assault', 'substance abuse', 'transphobia', 'violence', 'war violence']
};

const SubmitReviewScreen: React.FC<SubmitReviewScreenProps> = ({ route, navigation }) => {
  const { id, isGoogleBook, product } = route.params;
  const userDetails = useStore((state: any) => state.userDetails);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [rating, setRating] = useState(0);
  const [reviewHtml, setReviewHtml] = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [tags, setTags] = useState<Record<keyof typeof TAG_CATEGORIES, string[]>>({
    characters: [],
    plot: [],
    setting: [],
    writingStyle: [],
    contentWarnings: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const handleEmotionToggle = (emotion: string) => {
    setSelectedEmotions(prev => 
      prev.includes(emotion) 
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  };

  const handleTagToggle = (category: keyof typeof TAG_CATEGORIES, tag: string) => {
    setTags(prev => ({
      ...prev,
      [category]: prev[category].includes(tag)
        ? prev[category].filter(t => t !== tag)
        : [...prev[category], tag]
    }));
  };

  const stepNavigation = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else if (direction === 'prev' && currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please provide a rating.');
      return;
    }

    setIsSubmitting(true);
    try {
      let bookId = id;

      // Handle Google Book sync
      if (isGoogleBook) {
        const bookData = {
          ISBN: product.volumeInfo?.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier || '',
          Title: product.volumeInfo?.title || '',
          Pages: product.volumeInfo?.pageCount || 0,
          Price: product.saleInfo?.listPrice?.amount || 0,
          Description: product.volumeInfo?.description || '',
          Authors: product.volumeInfo?.authors || [],
          Genres: product.volumeInfo?.categories || [],
          Image: product.volumeInfo?.imageLinks?.thumbnail || '',
        };

        const response = await instance.post(requests.addBook, bookData);
        if (response.data.status === "success") {
          bookId = response.data.data.bookId;
        } else {
          throw new Error('Failed to add/update book');
        }
      }

      const emotionsData = EMOTIONS.map(emotion => ({
        emotionId: emotion.emotionId,
        isChecked: selectedEmotions.includes(emotion.emotion)
      }));

      const reviewData = {
        productId: bookId,
        rating: rating,
        review: reviewHtml,
        emotions: emotionsData,
        tags: tags
      };

      const response = await instance.post(requests.submitReview, reviewData, {
        headers: { Authorization: `Bearer ${userDetails[0].accessToken}` }
      });

      if (response.data.data.status === 'success') {
        Alert.alert('Thanks!', 'Review added successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCategoryName = (category: string) => {
    const formatted = {
      writingStyle: 'Writing Style',
      contentWarnings: 'Content Warnings'
    }[category] || category;
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Overall Rating</Text>
            <View style={styles.ratingContainer}>
              <StarRating
                maxStars={5}
                starSize={40}
                color={COLORS.primaryOrangeHex}
                rating={rating}
                enableHalfStar={true}
                enableSwiping={true}
                onChange={setRating}
              />
              <Text style={styles.ratingText}>{rating.toFixed(1)} / 5.0</Text>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>How did this book make you feel?</Text>
            <View style={styles.emotionsGrid}>
              {EMOTIONS.map(emotion => (
                <View key={emotion.emotionId} style={styles.emotionItem}>
                  <BouncyCheckbox
                    isChecked={selectedEmotions.includes(emotion.emotion)}
                    onPress={() => handleEmotionToggle(emotion.emotion)}
                    fillColor={COLORS.primaryOrangeHex}
                    unFillColor={COLORS.primaryGreyHex}
                  />
                  <Text style={styles.emotionLabel}>{emotion.emotion}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      case 3:
        return (
          <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepTitle}>How would you describe this book?</Text>
            {Object.entries(TAG_CATEGORIES).map(([category, categoryTags]) => (
              <View key={category} style={styles.categoryContainer}>
                <Text style={styles.categoryTitle}>{formatCategoryName(category)}</Text>
                <View style={styles.tagsContainer}>
                  {categoryTags.map(tag => (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => handleTagToggle(category as keyof typeof TAG_CATEGORIES, tag)}
                      style={[
                        styles.tagButton,
                        tags[category as keyof typeof TAG_CATEGORIES].includes(tag) && styles.tagButtonSelected
                      ]}
                    >
                      <Text style={[
                        styles.tagText,
                        tags[category as keyof typeof TAG_CATEGORIES].includes(tag) && styles.tagTextSelected
                      ]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Got more to say?</Text>
            <Text style={styles.stepSubtitle}>Your detailed review:</Text>
            <View style={styles.editorContainer}>
              <WysiwygEditor
                value={reviewHtml}
                onChange={setReviewHtml}
                maxChars={5000}
              />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primaryWhiteHex} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Write a Review</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>Step {currentStep} of {totalSteps}</Text>
          <Text style={styles.progressText}>{Math.round(progress)}% Complete</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Step Content */}
      <View style={styles.content}>
        {renderStepContent()}
      </View>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          onPress={() => stepNavigation('prev')}
          disabled={currentStep === 1}
          style={[styles.navButton, currentStep === 1 && styles.navButtonDisabled]}
        >
          <Ionicons name="chevron-back" size={20} color={currentStep === 1 ? COLORS.primaryGreyHex : COLORS.primaryWhiteHex} />
          <Text style={[styles.navButtonText, currentStep === 1 && styles.navButtonTextDisabled]}>Previous</Text>
        </TouchableOpacity>

        {currentStep < totalSteps ? (
          <TouchableOpacity
            onPress={() => stepNavigation('next')}
            style={styles.nextButton}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.primaryWhiteHex} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleSubmitReview}
            disabled={isSubmitting}
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.space_20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryGreyHex,
  },
  backButton: {
    marginRight: SPACING.space_16,
  },
  headerTitle: {
    fontSize: FONTSIZE.size_20,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
  progressContainer: {
    padding: SPACING.space_20,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.space_12,
  },
  progressText: {
    fontSize: FONTSIZE.size_12,
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_4,
  },
  content: {
    flex: 1,
    padding: SPACING.space_20,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: FONTSIZE.size_24,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
    textAlign: 'center',
    marginBottom: SPACING.space_24,
  },
  stepSubtitle: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.secondaryLightGreyHex,
    marginBottom: SPACING.space_12,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  ratingText: {
    fontSize: FONTSIZE.size_18,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
    marginTop: SPACING.space_12,
  },
  emotionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emotionItem: {
    flexDirection: 'row',
    width: '48%',
    marginBottom: SPACING.space_16,
  },
  emotionLabel: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
    marginLeft: SPACING.space_12,
  },
  categoryContainer: {
    marginBottom: SPACING.space_20,
    backgroundColor: COLORS.secondaryDarkGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    padding: SPACING.space_16,
  },
  categoryTitle: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryOrangeHex,
    marginBottom: SPACING.space_12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagButton: {
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_15,
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_8,
    margin: SPACING.space_4,
  },
  tagButtonSelected: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  tagText: {
    fontSize: FONTSIZE.size_12,
    fontFamily: FONTFAMILY.poppins_regular,
    color: COLORS.secondaryLightGreyHex,
  },
  tagTextSelected: {
    color: COLORS.primaryWhiteHex,
  },
  editorContainer: {
    height: 200,
    borderWidth: 1,
    borderColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_8,
    overflow: 'hidden',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.space_20,
    borderTopWidth: 1,
    borderTopColor: COLORS.primaryGreyHex,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryGreyHex,
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_15,
  },
  navButtonDisabled: {
    backgroundColor: COLORS.primaryGreyHex,
  },
  navButtonText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
    marginLeft: SPACING.space_8,
  },
  navButtonTextDisabled: {
    color: COLORS.secondaryLightGreyHex,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryOrangeHex,
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_15,
  },
  nextButtonText: {
    fontSize: FONTSIZE.size_14,
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryWhiteHex,
    marginRight: SPACING.space_8,
  },
  submitButton: {
    backgroundColor: COLORS.primaryOrangeHex,
    paddingHorizontal: SPACING.space_24,
    paddingVertical: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_15,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.primaryGreyHex,
  },
  submitButtonText: {
    fontSize: FONTSIZE.size_16,
    fontFamily: FONTFAMILY.poppins_semibold,
    color: COLORS.primaryWhiteHex,
  },
});

export default SubmitReviewScreen;