import React, { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign } from '@expo/vector-icons';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS } from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import GradientBGIcon from '../../../components/GradientBGIcon';
import { useStore } from '../../../store/store';
import { AutocompleteDropdown } from '../components/AutocompleteDropdown';
import CustomPicker, { PickerOption } from '../../../components/CustomPickerComponent';
import HeaderBar from '../../../components/HeaderBar';

interface Contributor {
  name: string;
  role: string;
}

const Input = ({ label, value, onChange, placeholder, required = false, keyboardType = 'default' }: any) => (
  <View style={styles.Field}>
    <Text style={styles.Label}>
      {label} {required && <Text style={styles.Required}>*</Text>}
    </Text>
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={COLORS.secondaryLightGreyHex}
      style={styles.Input}
      keyboardType={keyboardType}
    />
  </View>
);

const Multiline = ({ label, value, onChange, placeholder }: any) => (
  <View style={styles.Field}>
    <Text style={styles.Label}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={COLORS.secondaryLightGreyHex}
      multiline
      numberOfLines={5}
      style={[styles.Input, styles.MultilineInput]}
      textAlignVertical="top"
    />
  </View>
);

const SectionTitle = ({ children }: any) => (
  <Text style={styles.Section}>{children}</Text>
);

const HelperText = ({ children }: any) => (
  <Text style={styles.HelperText}>{children}</Text>
);

const AddButton = ({ title, onPress }: any) => (
  <TouchableOpacity onPress={onPress} style={styles.AddBtn}>
    <Text style={styles.AddText}>{title}</Text>
  </TouchableOpacity>
);

const PrimaryButton = ({ title, onPress, disabled = false }: any) => (
  <TouchableOpacity 
    onPress={onPress} 
    style={[styles.Submit, disabled && styles.SubmitDisabled]}
    disabled={disabled}
  >
    <Text style={styles.SubmitText}>{title}</Text>
  </TouchableOpacity>
);

const SecondaryButton = ({ title, onPress }: any) => (
  <TouchableOpacity onPress={onPress} style={styles.CancelBtn}>
    <Text style={styles.CancelText}>{title}</Text>
  </TouchableOpacity>
);

const formatOptions: PickerOption[] = [
  { label: 'Paperback', value: 'paperback', icon: 'book' },
  { label: 'Hardcover', value: 'hardcover', icon: 'menu-book' },
  { label: 'Digital', value: 'ebook', icon: 'tablet' },
  { label: 'Audio', value: 'audiobook', icon: 'headset' },
];

const contributorRoleOptions: PickerOption[] = [
  { label: 'Narrator', value: 'narrator', icon: 'record-voice-over' },
  { label: 'Translator', value: 'translator', icon: 'translate' },
  { label: 'Illustrator', value: 'illustrator', icon: 'palette' },
  { label: 'Editor', value: 'editor', icon: 'edit' },
  { label: 'Foreword Author', value: 'foreword_author', icon: 'description' },
  { label: 'Afterword Author', value: 'afterword_author', icon: 'article' },
];

const AddEditionScreen = ({ navigation, route }: any) => {
  const { workId, title } = route.params;
  const userDetails = useStore((state: any) => state.userDetails);

  const [bookTitle, setBookTitle] = useState(title);
  const [isbn, setIsbn] = useState('');
  const [format, setFormat] = useState<'paperback' | 'hardcover' | 'ebook' | 'audiobook'>('paperback');
  const [pageCount, setPageCount] = useState('');
  const [description, setDescription] = useState('');
  const [audio, setAudio] = useState({ h: '', m: '', s: '' });
  const [language, setLanguage] = useState('English');
  const [publisher, setPublisher] = useState('');
  const [publicationYear, setPublicationYear] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverError, setCoverError] = useState(false);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBackPress = () => {
    navigation.goBack();
  };

  const addContributor = () => {
    setContributors([...contributors, { name: '', role: 'narrator' }]);
  };

  const removeContributor = (index: number) => {
    setContributors(contributors.filter((_, i) => i !== index));
  };

  const updateContributor = (index: number, field: 'name' | 'role', value: string) => {
    const updated = [...contributors];
    updated[index][field] = value;
    setContributors(updated);
  };

  const validateForm = () => {
    if (!bookTitle.trim()) {
      setError('Title is required');
      return false;
    }
    if (!language.trim()) {
      setError('Language is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    // Parse audio duration
    let audioDurationSec = null;
    if (format === 'audiobook' && (audio.h || audio.m || audio.s)) {
      audioDurationSec =
        (parseInt(audio.h || '0') * 3600) +
        (parseInt(audio.m || '0') * 60) +
        parseInt(audio.s || '0');
    }

    const editionData = {
      title: bookTitle,
      isbn: isbn || null,
      format,
      pageCount: pageCount ? parseInt(pageCount) : null,
      description: description || null,
      audioDurationSec,
      language,
      publisher: publisher || null,
      publicationYear: publicationYear ? parseInt(publicationYear) : null,
      cover: coverUrl || null,
      contributors: contributors
        .filter((c) => c.name.trim())
        .map((c) => ({ name: c.name, role: c.role })),
    };

    try {
      await instance.post(requests.addWorkEdition(workId), editionData, {
        headers: {
          Authorization: `Bearer ${userDetails[0].accessToken}`,
        },
      });
      Alert.alert('Success', 'Edition added successfully', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Editions', { workId, title, currentBookId: null }),
        },
      ]);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to add edition');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.Screen}>
      <StatusBar backgroundColor={COLORS.primaryBlackHex} />
      <HeaderBar showBackButton />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.KeyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.Container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Title Section */}
          <Text style={styles.Title}>Add an Edition</Text>
          <View style={styles.SubtitleContainer}>
            <Text style={styles.Subtitle}>
              for <Text style={styles.SubtitleHighlight}>{title}</Text>
            </Text>
          </View>

          {/* Warning Box */}
          <View style={styles.WarningBox}>
            <Text style={styles.WarningText}>
              Before adding a book, please make sure that it's not already in our database.
              You must only use author or publisher websites for book data, or refer to copies of the book that you own.
            </Text>
          </View>

          {/* Error Display */}
          {error ? (
            <View style={styles.ErrorBox}>
              <Text style={styles.ErrorText}>{error}</Text>
            </View>
          ) : null}

          {/* Title */}
          <Input 
            label="Title" 
            value={bookTitle} 
            onChange={setBookTitle}
            placeholder="Enter book title"
            required
          />

          {/* Contributors */}
          <SectionTitle>Contributors</SectionTitle>
          <HelperText>
            Add narrators, translators, illustrators, etc.
          </HelperText>
          
          {contributors.map((c, i) => (
            <View key={i} style={styles.ContributorRow}>
              <View style={styles.ContributorInputs}>
                <View style={styles.ContributorName}>
                  <ContributorAutocomplete
                    value={c.name}
                    onChange={(v: string) => updateContributor(i, 'name', v)}
                    placeholder="Contributor name"
                  />
                </View>
                
                <View style={styles.ContributorRole}>
                  <CustomPicker
                    options={contributorRoleOptions}
                    selectedValue={c.role}
                    onValueChange={(v) => updateContributor(i, 'role', v)}
                  />
                </View>
              </View>
              
              <TouchableOpacity 
                onPress={() => removeContributor(i)}
                style={styles.RemoveButton}
              >
                <Text style={styles.RemoveContributor}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
          
          <AddButton title="+ Add a contributor" onPress={addContributor} />

          {/* Description/Blurb */}
          <Multiline 
            label="Blurb" 
            value={description} 
            onChange={setDescription}
            placeholder="Enter book description or blurb"
          />

          {/* Cover Image URL */}
          <View style={styles.Field}>
            <Text style={styles.Label}>Cover Image URL</Text>
            <HelperText>
              If you don't add a cover image, the cover image of another edition will be used.
            </HelperText>
            <TextInput
              value={coverUrl}
              onChangeText={(text) => {
                setCoverUrl(text);
                setCoverError(false);
              }}
              placeholder="https://example.com/cover.jpg"
              placeholderTextColor={COLORS.secondaryLightGreyHex}
              style={styles.Input}
              keyboardType="url"
            />
            {coverUrl ? (
              <View style={styles.CoverPreview}>
                <Text style={styles.PreviewLabel}>Preview:</Text>
                {!coverError ? (
                  <Image 
                    source={{ uri: coverUrl }} 
                    style={styles.Cover}
                    onError={() => setCoverError(true)}
                  />
                ) : (
                  <Text style={styles.CoverError}>
                    Unable to load image. Please check the URL.
                  </Text>
                )}
              </View>
            ) : null}
          </View>

          {/* ISBN */}
          <View style={styles.Field}>
            <Text style={styles.Label}>ISBN/Unique Identifier</Text>
            <HelperText>
              Only include numbers or capital letters, remove any spaces or hyphen characters
            </HelperText>
            <TextInput
              value={isbn}
              onChangeText={setIsbn}
              placeholder="9781234567890"
              placeholderTextColor={COLORS.secondaryLightGreyHex}
              style={styles.Input}
            />
          </View>

          {/* Format */}
          <View style={styles.Field}>
            <Text style={styles.Label}>
              Edition Format <Text style={styles.Required}>*</Text>
            </Text>
            <CustomPicker
              options={formatOptions}
              selectedValue={format}
              onValueChange={(value) => setFormat(value as any)}
            />
          </View>

          {/* Conditional: Page Count or Audio Duration */}
          {format !== 'audiobook' ? (
            <View style={styles.Field}>
              <Text style={styles.Label}>Number of Pages</Text>
              <HelperText>Leave blank for audiobooks</HelperText>
              <TextInput
                value={pageCount}
                onChangeText={setPageCount}
                placeholder="Enter page count"
                placeholderTextColor={COLORS.secondaryLightGreyHex}
                style={styles.Input}
                keyboardType="number-pad"
              />
            </View>
          ) : (
            <View style={styles.Field}>
              <Text style={styles.Label}>Audio Duration</Text>
              <HelperText>Input the duration as hours, minutes, and seconds</HelperText>
              <View style={styles.AudioRow}>
                <View style={styles.AudioField}>
                  <Text style={styles.AudioLabel}>Hours</Text>
                  <TextInput
                    value={audio.h}
                    onChangeText={(v) => setAudio({ ...audio, h: v })}
                    placeholder="0"
                    placeholderTextColor={COLORS.secondaryLightGreyHex}
                    style={styles.Input}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.AudioField}>
                  <Text style={styles.AudioLabel}>Minutes</Text>
                  <TextInput
                    value={audio.m}
                    onChangeText={(v) => setAudio({ ...audio, m: v })}
                    placeholder="0"
                    placeholderTextColor={COLORS.secondaryLightGreyHex}
                    style={styles.Input}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.AudioField}>
                  <Text style={styles.AudioLabel}>Seconds</Text>
                  <TextInput
                    value={audio.s}
                    onChangeText={(v) => setAudio({ ...audio, s: v })}
                    placeholder="0"
                    placeholderTextColor={COLORS.secondaryLightGreyHex}
                    style={styles.Input}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </View>
          )}

          {/* Publication Year */}
          <Input
            label="Publication Year"
            value={publicationYear}
            onChange={setPublicationYear}
            placeholder="2024"
            keyboardType="number-pad"
          />

          {/* Language */}
          <View style={styles.Field}>
            <Text style={styles.Label}>
              Language <Text style={styles.Required}>*</Text>
            </Text>
            <HelperText>One language, written in English, e.g. 'English' or 'Italian'</HelperText>
            <TextInput
              value={language}
              onChangeText={setLanguage}
              placeholder="English"
              placeholderTextColor={COLORS.secondaryLightGreyHex}
              style={styles.Input}
            />
          </View>

          {/* Publisher */}
          <Input
            label="Publisher Name"
            value={publisher}
            onChange={setPublisher}
            placeholder="Enter publisher name"
          />

          {/* Action Buttons */}
          <View style={styles.ButtonRow}>
            <View style={styles.ButtonHalf}>
              <PrimaryButton
                title={loading ? 'Adding Edition...' : 'Add Edition'}
                onPress={handleSubmit}
                disabled={loading}
              />
            </View>
            <View style={styles.ButtonHalf}>
              <SecondaryButton
                title="Cancel"
                onPress={handleBackPress}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Autocomplete Component
const ContributorAutocomplete = ({ 
  value, 
  onChange, 
  placeholder = "Contributor name" 
}: any) => {
  const fetchAuthors = async (query: string) => {
    const res = await instance.get(
      `${requests.searchAuthors}?searchParam=${encodeURIComponent(query)}&limit=10&offset=0`
    );
    return res.data.data.authors || [];
  };

  return (
    <AutocompleteDropdown
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      fetchFn={fetchAuthors}
      extractLabel={(a: any) => a.authorName}
      singleValue
    />
  );
};

const styles = StyleSheet.create({
  Screen: { 
    flex: 1, 
    backgroundColor: COLORS.primaryBlackHex 
  },
  KeyboardView: {
    flex: 1,
  },
  Container: { 
    padding: SPACING.space_20,
    paddingBottom: SPACING.space_30,
  },
  Header: {
    marginBottom: SPACING.space_20,
  },
  Title: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_28,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_8,
  },
  SubtitleContainer: {
    marginBottom: SPACING.space_20,
  },
  Subtitle: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_18,
    color: COLORS.secondaryLightGreyHex,
  },
  SubtitleHighlight: {
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.primaryOrangeHex,
  },
  WarningBox: {
    backgroundColor: COLORS.primaryGreyHex,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primaryOrangeHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_15,
    marginBottom: SPACING.space_20,
  },
  WarningText: {
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    lineHeight: 22,
  },
  ErrorBox: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    borderWidth: 1,
    borderColor: COLORS.primaryRedHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_15,
    marginBottom: SPACING.space_20,
  },
  ErrorText: {
    color: COLORS.primaryRedHex,
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_16,
  },
  Field: { 
    marginBottom: SPACING.space_16 
  },
  Label: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    marginBottom: SPACING.space_8,
  },
  Required: {
    color: COLORS.primaryRedHex,
  },
  HelperText: {
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    marginBottom: SPACING.space_8,
    lineHeight: 18,
  },
  Input: {
    backgroundColor: COLORS.primaryGreyHex,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    padding: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  MultilineInput: {
    height: 120,
    paddingTop: SPACING.space_12,
  },
  Section: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_18,
    marginTop: SPACING.space_8,
    marginBottom: SPACING.space_12,
  },
  ContributorRow: {
    marginBottom: SPACING.space_16,
  },
  ContributorInputs: {
    flexDirection: 'row',
    gap: SPACING.space_8,
    marginBottom: SPACING.space_8,
  },
  ContributorName: {
    flex: 1.5,
  },
  ContributorRole: {
    flex: 1,
  },
  RemoveButton: {
    borderWidth: 1,
    borderColor: COLORS.primaryRedHex,
    padding: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_10,
    alignItems: 'center',
  },
  RemoveContributor: { 
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
  },
  CoverPreview: {
    marginTop: SPACING.space_12,
    padding: SPACING.space_12,
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    borderWidth: 1,
    borderColor: COLORS.secondaryDarkGreyHex,
  },
  PreviewLabel: {
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    marginBottom: SPACING.space_8,
  },
  Cover: { 
    width: 120, 
    height: 180, 
    borderRadius: BORDERRADIUS.radius_8,
    borderWidth: 2,
    borderColor: COLORS.primaryOrangeHex,
  },
  CoverError: {
    color: COLORS.primaryRedHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    marginTop: SPACING.space_8,
  },
  AudioRow: {
    flexDirection: 'row',
    gap: SPACING.space_12,
  },
  AudioField: {
    flex: 1,
  },
  AudioLabel: {
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    marginBottom: SPACING.space_8,
  },
  AddBtn: { 
    marginBottom: SPACING.space_16,
    paddingVertical: SPACING.space_12,
  },
  AddText: { 
    color: COLORS.primaryOrangeHex,
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
  },
  ButtonRow: {
    flexDirection: 'row',
    gap: SPACING.space_12,
    marginTop: SPACING.space_20,
  },
  ButtonHalf: {
    flex: 1,
  },
  Submit: {
    backgroundColor: COLORS.primaryOrangeHex,
    padding: SPACING.space_16,
    borderRadius: BORDERRADIUS.radius_10,
    alignItems: 'center',
  },
  SubmitDisabled: {
    backgroundColor: COLORS.primaryGreyHex,
    opacity: 0.6,
  },
  SubmitText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
  },
  CancelBtn: {
    backgroundColor: COLORS.primaryGreyHex,
    padding: SPACING.space_16,
    borderRadius: BORDERRADIUS.radius_10,
    alignItems: 'center',
  },
  CancelText: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
  },
});

export default AddEditionScreen;