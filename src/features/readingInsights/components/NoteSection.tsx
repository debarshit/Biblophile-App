import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Entypo } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import instance from '../../../services/axios';
import requests from '../../../services/requests';

const NoteSection = ({ userDetails }) => {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState("");
  const [selectedBook, setSelectedBook] = useState("");
  const [readingBooks, setReadingBooks] = useState([]);

  const toggleNoteInput = () => {
    setShowNoteInput(prev => !prev);
    if (!showNoteInput) {
      fetchCurrentReads();
    }
  };

  const fetchCurrentReads = async () => {
    try {
      const response = await instance.post(requests.fetchCurrentReads, {
        userId: userDetails[0].userId,
      });
      setReadingBooks(response.data.currentReads);
    } catch (error) {
      console.error('Failed to fetch current reads:', error);
    } 
  };
  
  const handleNoteSubmit = async () => {
    if (!note) {
      Alert.alert('Error', 'Please write a note.');
      return;
    }

    try {
      const noteData = {
        userId: userDetails[0].userId,
        bookId: selectedBook,
        note: note,
      };

      const response = await instance.post(requests.submitNote, noteData);
      if (response.data.message === 'Note added successfully.') {
        Alert.alert('Success', 'Note added successfully.');
        setNote("");
        setSelectedBook("");
        setShowNoteInput(false);
      } else {
        Alert.alert('Error', response.data.message || 'Something went wrong.');
      }
    } catch (error) {
      console.error('Error submitting note:', error);
      Alert.alert('Error', 'There was an error :( Try again in a while');
    }
  };

  const renderNotesInput = () => {
    if (showNoteInput) {
      return (
        <View style={styles.noteInputSection}>
          <TextInput
            style={styles.noteInput}
            placeholder="Jot down your thoughts for today in 300 char..."
            placeholderTextColor={COLORS.secondaryLightGreyHex}
            value={note}
            onChangeText={setNote}
            numberOfLines={5}
          />
          <Picker
            selectedValue={selectedBook}
            style={styles.bookDropdown}
            onValueChange={(itemValue) => setSelectedBook(itemValue)}
          >
            <Picker.Item label="Is it related to a specific book?" value={null} />
            {readingBooks.map((book) => (
              <Picker.Item key={book.BookId} label={book.BookName} value={book.BookId} />
            ))}
          </Picker>
          <TouchableOpacity onPress={handleNoteSubmit}>
            <Entypo name="check" color={COLORS.primaryOrangeHex} size={FONTSIZE.size_24} />
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.addNoteSection}>
      <TouchableOpacity style={styles.addNoteButton} onPress={toggleNoteInput}>
        <Entypo name="feather" color={COLORS.primaryOrangeHex} size={FONTSIZE.size_24} />
        <Text style={styles.addNoteText}>{!showNoteInput ? "Add a note" : "Cancel"}</Text>
      </TouchableOpacity>
      {renderNotesInput()}
    </View>
  );
};

const styles = StyleSheet.create({
  addNoteSection: {
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: 15,
    padding: SPACING.space_15,
    margin: SPACING.space_15,
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNoteText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryOrangeHex,
    marginLeft: SPACING.space_10,
  },
  noteInputSection: {
    marginTop: SPACING.space_15,
  },
  noteInput: {
    backgroundColor: COLORS.primaryBlackHex,
    borderRadius: 10,
    padding: SPACING.space_10,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    height: 100,
    textAlignVertical: 'top',
  },
  bookDropdown: {
    backgroundColor: COLORS.primaryBlackHex,
    color: COLORS.primaryWhiteHex,
    marginVertical: SPACING.space_10,
  },
});

export default NoteSection;