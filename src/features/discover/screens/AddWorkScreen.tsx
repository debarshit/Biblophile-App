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
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS } from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { useStore } from '../../../store/store';
import { AutocompleteDropdown } from '../components/AutocompleteDropdown';
import CustomPicker, { PickerOption } from '../../../components/CustomPickerComponent';
import HeaderBar from '../../../components/HeaderBar';

const Input = ({ label, value, onChange, placeholder, required = false, keyboardType = 'default', maxLength }: any) => (
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
      maxLength={maxLength}
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

const AddWorkScreen = ({ navigation }: any) => {
  const userDetails = useStore((state: any) => state.userDetails);

  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [contributors, setContributors] = useState<
    { name: string; role: string }[]
  >([]);
  const [seriesName, setSeriesName] = useState('');
  const [seriesPosition, setSeriesPosition] = useState('');
  const [seriesLabel, setSeriesLabel] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverError, setCoverError] = useState(false);
  const [bookType, setBookType] = useState<'fiction' | 'non-fiction'>('fiction');
  const [genres, setGenres] = useState('');
  const [isbn, setIsbn] = useState('');
  const [format, setFormat] = useState<'paperback' | 'hardcover' | 'ebook' | 'audiobook'>('paperback');
  const [pageCount, setPageCount] = useState('');
  const [audio, setAudio] = useState({ h: '', m: '', s: '' });
  const [publicationYear, setPublicationYear] = useState('');
  const [originalYear, setOriginalYear] = useState('');
  const [language, setLanguage] = useState('English');
  const [publisher, setPublisher] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addContributor = () => {
    setContributors([...contributors, { name: '', role: 'narrator' }]);
  };

  const updateContributor = (index: number, field: string, value: string) => {
    const updated = [...contributors];
    updated[index][field] = value;
    setContributors(updated);
  };

  const removeContributor = (index: number) => {
    setContributors(contributors.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title || !authors || !genres || !language) {
      setError('Please fill all required fields: Title, Author(s), Genres, and Language.');
      return;
    }

    const audioDurationSec =
      format === 'audiobook'
        ? Number(audio.h || 0) * 3600 +
          Number(audio.m || 0) * 60 +
          Number(audio.s || 0)
        : null;

    const payload = {
      title,
      description: description || null,
      originalLanguage: language,
      firstPublishedYear: originalYear ? Number(originalYear) : null,
      authors: authors.split(',').map(a => a.trim()).filter(Boolean),
      genres: genres.split(',').map(g => g.trim()).filter(Boolean),
      bookType,
      source: 'user-generated',
      series:
        seriesName && seriesPosition
          ? {
              name: seriesName,
              position: parseFloat(seriesPosition),
              displayLabel: seriesLabel || undefined,
            }
          : undefined,
      edition: {
        isbn: isbn || null,
        format,
        pageCount: format !== 'audiobook' ? Number(pageCount) || null : null,
        audioDurationSec,
        language,
        publisher: publisher || null,
        publicationYear: publicationYear ? Number(publicationYear) : null,
        cover:
          coverUrl ||
          'https://via.placeholder.com/300x450?text=No+Cover',
        contributors:
          contributors.length > 0
            ? contributors.filter(c => c.name.trim())
            : undefined,
      },
    };

    try {
      setLoading(true);
      setError('');
      const res = await instance.post(
        requests.createWork,
        payload,
        {
          headers: {
            Authorization: `Bearer ${userDetails[0].accessToken}`,
          },
        }
      );

      navigation.replace('Details', {
        id: res.data.data.bookId,
        type: 'Book',
      });
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to add book');
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
          <Text style={styles.Title}>Add a Book</Text>

          {/* Warning Box */}
          <View style={styles.WarningBox}>
            <Text style={styles.WarningText}>
              Before adding a book, please make sure that it's not already in our database.
              You must only use author or publisher websites for book data, or refer to copies of the book that you own.
            </Text>
            <Text style={[styles.WarningText, styles.WarningTextSecondary]}>
              We keep a log of all books created. Each one will eventually be reviewed, either automatically or by one of us.
            </Text>
          </View>

          {/* Error Display */}
          {error ? (
            <View style={styles.ErrorBox}>
              <Text style={styles.ErrorText}>{error}</Text>
            </View>
          ) : null}

          <Input 
            label="Title" 
            value={title} 
            onChange={setTitle}
            placeholder="Enter book title"
            required
          />

          {/* Authors */}
          <View style={styles.Field}>
            <Text style={styles.Label}>
              Author(s) <Text style={styles.Required}>*</Text>
            </Text>
            <HelperText>
              This field is for the main authors of the book. Other contributors can be listed separately below.
            </HelperText>
            <AuthorAutocomplete value={authors} onChange={setAuthors} />
          </View>

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

          {/* Series */}
          <SectionTitle>Series</SectionTitle>
          <View style={styles.Field}>
            <Text style={styles.Label}>Series Name</Text>
            <SeriesAutocomplete value={seriesName} onChange={setSeriesName} />
          </View>
          
          <View style={styles.SeriesRow}>
            <View style={styles.SeriesHalf}>
              <Text style={styles.Label}>Series Position</Text>
              <HelperText>Number, range, or non-consecutive numbers</HelperText>
              <TextInput
                value={seriesPosition}
                onChangeText={setSeriesPosition}
                placeholder="e.g., 1, 2.5, 1-3"
                placeholderTextColor={COLORS.secondaryLightGreyHex}
                style={styles.Input}
              />
            </View>
            
            <View style={styles.SeriesHalf}>
              <Text style={styles.Label}>Display Label (Optional)</Text>
              <HelperText>e.g., Book 1, Prequel or First book in series</HelperText>
              <TextInput
                value={seriesLabel}
                onChangeText={setSeriesLabel}
                placeholder="Display label"
                placeholderTextColor={COLORS.secondaryLightGreyHex}
                style={styles.Input}
              />
            </View>
          </View>

          <Multiline 
            label="Blurb" 
            value={description} 
            onChange={setDescription}
            placeholder="Enter book description or blurb"
          />

          {/* Cover URL */}
          <View style={styles.Field}>
            <Text style={styles.Label}>Cover Image URL</Text>
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

          {/* Book Type */}
          <Text style={styles.Label}>Book Type</Text>
          <View style={styles.BookTypeContainer}>
            {/* Fiction */}
            <View style={styles.radioGroup}>
              <View style={styles.BookTypeOption}>
                <BouncyCheckbox
                  size={25}
                  fillColor={COLORS.primaryOrangeHex}
                  unFillColor={COLORS.primaryGreyHex}
                  iconStyle={{ borderColor: COLORS.primaryOrangeHex }}
                  innerIconStyle={{ borderWidth: 2 }}
                  onPress={() => setBookType('fiction')}
                  isChecked={bookType === 'fiction'}
                />
                <View style={styles.BookTypeText}>
                  <Text style={styles.BookTypeTitle}>Fiction</Text>
                  <Text style={styles.BookTypeDesc}>Novels, stories & imaginative works</Text>
                </View>
              </View>

              {/* Non-fiction */}
              <View style={styles.BookTypeOption}>
                <BouncyCheckbox
                  size={25}
                  fillColor={COLORS.primaryOrangeHex}
                  unFillColor={COLORS.primaryGreyHex}
                  iconStyle={{ borderColor: COLORS.primaryOrangeHex }}
                  innerIconStyle={{ borderWidth: 2 }}
                  onPress={() => setBookType('non-fiction')}
                  isChecked={bookType === 'non-fiction'}
                />
                <View style={styles.BookTypeText}>
                  <Text style={styles.BookTypeTitle}>Nonfiction</Text>
                  <Text style={styles.BookTypeDesc}>Educational, factual & real-world</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Genres */}
          <View style={styles.Field}>
            <Text style={styles.Label}>
              Genres <Text style={styles.Required}>*</Text>
            </Text>
            <GenreAutocomplete value={genres} onChange={setGenres} />
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

          <Input
            label="Edition Publication Date"
            value={publicationYear}
            onChange={setPublicationYear}
            placeholder="2024"
            keyboardType="number-pad"
          />

          <View style={styles.Field}>
            <Text style={styles.Label}>Original Publication Year</Text>
            <HelperText>Put in '0' if the original publication year is unknown</HelperText>
            <TextInput
              value={originalYear}
              onChangeText={setOriginalYear}
              placeholder="2020"
              placeholderTextColor={COLORS.secondaryLightGreyHex}
              style={styles.Input}
              keyboardType="number-pad"
            />
          </View>

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
                title={loading ? 'Adding Book...' : 'Add Book'}
                onPress={handleSubmit}
                disabled={loading}
              />
            </View>
            <View style={styles.ButtonHalf}>
              <SecondaryButton
                title="Cancel"
                onPress={() => navigation.goBack()}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddWorkScreen;

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
  Title: {
    fontFamily: FONTFAMILY.poppins_bold,
    fontSize: FONTSIZE.size_24,
    color: COLORS.primaryWhiteHex,
    marginBottom: SPACING.space_20,
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
    fontSize: FONTSIZE.size_12,
    lineHeight: 18,
  },
  WarningTextSecondary: {
    marginTop: SPACING.space_10,
    fontSize: FONTSIZE.size_10,
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
    fontSize: FONTSIZE.size_14,
  },
  Field: { 
    marginBottom: SPACING.space_16 
  },
  Label: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
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
    lineHeight: 16,
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
  SeriesRow: {
    flexDirection: 'row',
    gap: SPACING.space_12,
    marginBottom: SPACING.space_16,
  },
  SeriesHalf: {
    flex: 1,
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
  BookTypeContainer: {
    gap: SPACING.space_12,
    marginBottom: SPACING.space_16,
  },
  BookTypeOption: {
    flexDirection: 'column',
    flex: 0.4,
    alignItems: 'center',
    backgroundColor: COLORS.primaryGreyHex,
    borderWidth: 2,
    borderColor: COLORS.primaryLightGreyHex,
    borderRadius: BORDERRADIUS.radius_10,
    padding: SPACING.space_12,
  },
  BookTypeText: {
    marginLeft: SPACING.space_8,
    flex: 1,
  },
  BookTypeTitle: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
  },
  BookTypeDesc: {
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    marginTop: 2,
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
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.space_10,
  },
});

// Autocomplete Components (same as before but with updated styling)
const AuthorAutocomplete = ({ value, onChange }: any) => {
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
      placeholder="Author names (comma separated)"
      fetchFn={fetchAuthors}
      extractLabel={(a: any) => a.authorName}
    />
  );
};

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

const GenreAutocomplete = ({ value, onChange }: any) => {
  const fetchGenres = async (query: string) => {
    const res = await instance.get(
      `${requests.searchGenres}?searchParam=${encodeURIComponent(query)}&limit=10&offset=0`
    );
    return res.data.data.genres || [];
  };

  return (
    <AutocompleteDropdown
      value={value}
      onChange={onChange}
      placeholder="Genres (comma separated)"
      fetchFn={fetchGenres}
      extractLabel={(g: any) => g.genreName}
    />
  );
};

const SeriesAutocomplete = ({ value, onChange }: any) => {
  const fetchSeries = async (query: string) => {
    const res = await instance.get(
      `${requests.searchSeries}?searchParam=${encodeURIComponent(query)}&limit=10&offset=0`
    );
    return res.data.data.series || [];
  };

  return (
    <AutocompleteDropdown
      value={value}
      onChange={onChange}
      placeholder="Series name"
      fetchFn={fetchSeries}
      extractLabel={(s: any) => s.seriesName}
      singleValue
    />
  );
};