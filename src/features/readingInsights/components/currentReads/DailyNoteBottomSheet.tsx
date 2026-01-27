import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Entypo } from '@expo/vector-icons';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../../theme/theme';
import instance from '../../../../services/axios';
import requests from '../../../../services/requests';
import CustomPicker from '../../../../components/CustomPickerComponent';

interface NoteBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  userDetails: any;
}

const DailyNoteBottomSheet = ({ visible, onClose, userDetails }: NoteBottomSheetProps) => {
  const [note, setNote] = useState("");
  const [selectedUserBook, setSelectedUserBook] = useState("");
  const [readingBooks, setReadingBooks] = useState([]);

  useEffect(() => {
    if (visible) {
      fetchCurrentReads();
    }
  }, [visible]);

  const fetchCurrentReads = async () => {
    try {
      const currentReadsResponse = await instance(requests.fetchCurrentReads, {
        headers: {
          Authorization: `Bearer ${userDetails[0].accessToken}`
        },
      });
      const response = currentReadsResponse.data;
      setReadingBooks(response.data.currentReads);
    } catch (error) {
      console.error('Failed to fetch current reads:', error);
    }
  };

  const handleNoteSubmit = async () => {
    if (!note.trim()) {
      Alert.alert('Error', 'Please write a note.');
      return;
    }

    try {
      const selectedBook = readingBooks.find(book => book.UserBookId === selectedUserBook);
      
      const noteData = {
        userBookId: selectedUserBook || null,
        bookId: selectedBook?.BookId || null,
        progressUnit: selectedBook?.ProgressUnit || null,
        progressValue: selectedBook?.ProgressValue || null,
        note: note.trim(),
      };

      const response = await instance.post(requests.submitNote, noteData, {
        headers: {
          Authorization: `Bearer ${userDetails[0].accessToken}`
        },
      });

      if (response.data.data.message === 'Note added successfully.') {
        Alert.alert('Success', 'Note added successfully.');
        handleClose();
      } else {
        Alert.alert('Error', response.data.data.message || 'Something went wrong.');
      }
    } catch (error) {
      console.error('Error submitting note:', error);
      Alert.alert('Error', 'There was an error :( Try again in a while');
    }
  };

  const handleClose = () => {
    setNote("");
    setSelectedUserBook("");
    onClose();
  };

  const getPickerOptions = () => {
    return readingBooks.map(book => ({
      label: book.BookName,
      value: book.UserBookId, // Changed from BookId to UserBookId
      icon: 'book'
    }));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        
        <View style={styles.bottomSheet}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <Entypo name="feather" color={COLORS.primaryOrangeHex} size={FONTSIZE.size_24} />
            <Text style={styles.headerText}>Reflect on today's reading</Text>
          </View>

          <TextInput
            style={styles.noteInput}
            placeholder="Jot down your thoughts or insights..."
            placeholderTextColor={COLORS.secondaryLightGreyHex}
            value={note}
            onChangeText={setNote}
            maxLength={300}
            numberOfLines={5}
            multiline
            textAlignVertical="top"
            autoFocus
          />
          <Text style={styles.characterCount}>{note.length}/300</Text>

          {readingBooks.length > 0 && (
            <CustomPicker
              options={getPickerOptions()}
              selectedValue={selectedUserBook}
              onValueChange={setSelectedUserBook}
              placeholder="Link to a specific book (optional)"
              style={styles.customPickerStyle}
            />
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleClose}
              style={[styles.button, styles.skipButton]}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNoteSubmit}
              style={[styles.button, styles.saveButton]}
            >
              <Text style={styles.saveButtonText}>Save Note</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    backgroundColor: COLORS.primaryGreyHex,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: SPACING.space_20,
    paddingBottom: Platform.OS === 'ios' ? SPACING.space_30 : SPACING.space_20,
    maxHeight: '70%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.secondaryLightGreyHex,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.space_15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.space_20,
  },
  headerText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
    marginLeft: SPACING.space_10,
  },
  noteInput: {
    backgroundColor: COLORS.primaryBlackHex,
    borderRadius: 15,
    padding: SPACING.space_15,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: SPACING.space_4,
  },
  characterCount: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.secondaryLightGreyHex,
    textAlign: 'right',
    marginBottom: SPACING.space_15,
  },
  customPickerStyle: {
    marginBottom: SPACING.space_15,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.space_12,
    marginTop: SPACING.space_10,
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.space_15,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    backgroundColor: COLORS.primaryBlackHex,
    borderWidth: 1,
    borderColor: COLORS.secondaryLightGreyHex,
  },
  skipButtonText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  saveButton: {
    backgroundColor: COLORS.primaryOrangeHex,
  },
  saveButtonText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
});

export default DailyNoteBottomSheet;