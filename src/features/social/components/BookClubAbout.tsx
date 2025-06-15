import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';
import { useStore } from '../../../store/store';
import requests from '../../../services/requests';
import instance from '../../../services/axios';

interface BookClub {
  clubId: number;
  about: string;
  codeOfConduct: string;
}

interface Props {
  bookClub: BookClub;
  isHost: boolean;
}

const BookClubAbout: React.FC<Props> = ({
  bookClub,
  isHost,

}) => {
  const [about, setAbout] = useState(bookClub.about || 'Such empty! Much wow!');
  const [codeOfConduct, setCodeOfConduct] = useState(bookClub.codeOfConduct || 'Such empty! Much wow!');
  const [editingField, setEditingField] = useState<'about' | 'code' | null>(null);

  const userDetails = useStore((state: any) => state.userDetails);
  const accessToken = userDetails[0].accessToken;

  const handleUpdate = async (field: 'about' | 'code') => {
    const url =
    field === 'about'
      ? requests.updateBookClubAbout(bookClub.clubId)
      : requests.updateBookClubCode(bookClub.clubId);
    const body = {
      ...(field === 'about' ? { about } : { codeOfConduct })
    };

    try {
      const response = await instance.put(url, body, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const successMessage =
      field === 'about'
        ? 'Book club "about" content updated successfully.'
        : 'Book club Code of Conduct updated successfully.';

      if (response.data?.message === successMessage) {
        Alert.alert(
          'Success',
          field === 'about'
            ? 'About updated successfully!'
            : 'Code of Conduct updated successfully!'
        );
        setEditingField(null);
      } else {
        Alert.alert('Update failed', response.data?.message || 'Unexpected error');
      }
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      Alert.alert('Error', 'An error occurred while updating.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.heading}>About</Text>
        {editingField === 'about' ? (
          <>
            <TextInput
              style={styles.input}
              value={about}
              onChangeText={setAbout}
              multiline
            />
            <Button title="Save" onPress={() => handleUpdate('about')} />
          </>
        ) : (
          <>
            <Text style={styles.text}>{about}</Text>
            {isHost && (
              <Button title="Edit" onPress={() => setEditingField('about')} />
            )}
          </>
        )}
      </View>

      {/* Code of Conduct Section */}
      <View style={styles.section}>
        <Text style={styles.heading}>Code of Conduct</Text>
        {editingField === 'code' ? (
          <>
            <TextInput
              style={styles.input}
              value={codeOfConduct}
              onChangeText={setCodeOfConduct}
              multiline
            />
            <Button title="Save" onPress={() => handleUpdate('code')} />
          </>
        ) : (
          <>
            <Text style={styles.text}>{codeOfConduct}</Text>
            {isHost && (
              <Button title="Edit" onPress={() => setEditingField('code')} />
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
};

export default BookClubAbout;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#121212',
    flex: 1
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#1f1f1f',
    padding: 16,
    borderRadius: 10
  },
  heading: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 8,
    fontWeight: '600'
  },
  text: {
    color: '#ccc',
    marginBottom: 12
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    padding: 10,
    borderRadius: 8,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 10
  }
});