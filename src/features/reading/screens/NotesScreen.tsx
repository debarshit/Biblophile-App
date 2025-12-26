import React, { useState, useEffect } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, Alert, FlatList, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import instance from '../../../services/axios';
import requests from '../../../services/requests';
import { COLORS, SPACING, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../theme/theme';
import { useStore } from '../../../store/store';
import Mascot from '../../../components/Mascot';
import HeaderBar from '../../../components/HeaderBar';
import { convertHttpToHttps } from '../../../utils/convertHttpToHttps';

const NotesScreen: React.FC = ({navigation}: any) => {
    const [notes, setNotes] = useState([]);
    const [editing, setEditing] = useState<number | null>(null);
    const [currentNote, setCurrentNote] = useState('');
    const [offset, setOffset] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const userDetails = useStore((state: any) => state.userDetails);
    const userId = userDetails[0].userId;

    const fetchNotes = async (initial = false) => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const response = await instance.get(`${requests.fetchUserNotes}?offset=${offset}&limit=10&timezone=${userTimezone}`, {
                headers: {
                    Authorization: `Bearer ${userDetails[0].accessToken}`
                },
            });
            const newNotes = response.data.data;

            setNotes(initial ? newNotes : [...notes, ...newNotes]);

            if (newNotes.length < 10) {
                setHasMore(false);
            } else {
                setOffset(offset + 10);
            }
        } catch (error) {
            console.error("Error fetching reviews:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes(true);
    }, [userId]);

    const handleEdit = (note: any) => {
        setEditing(note.noteId);
        setCurrentNote(note.note);
    };

    const handleDelete = (noteId: number) => {
        Alert.alert(
            "Delete Note",
            "Are you sure you want to delete this note?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "OK", onPress: () => {
                        instance.put(requests.updateUserNote(noteId), {
                            actionType: 'delete'
                        }, {
                            headers: {
                                Authorization:  `Bearer ${userDetails[0].accessToken}`
                            },
                        })
                            .then(response => {
                                setNotes(notes.filter(note => note.noteId !== noteId));
                                Alert.alert(response.data.data.message);
                            })
                            .catch(error => console.error("Error deleting note:", error));
                    }
                }
            ]
        );
    };

    const handleSave = (noteId: number) => {
        instance.put(requests.updateUserNote(noteId), {
            note: currentNote,
            actionType: 'update'
        }, {
            headers: {
                Authorization:  `Bearer ${userDetails[0].accessToken}`
            },
        })
            .then(response => {
                setNotes(notes.map(note =>
                    note.noteId === noteId ? { ...note, note: currentNote } : note
                ));
                setEditing(null);
                Alert.alert(response.data.data.message);
            })
            .catch(error => console.error("Error updating note:", error));
    };

    const handleCancel = () => {
        setEditing(null);
        setCurrentNote('');
    };

    const handleChange = (value: string) => {
        setCurrentNote(value);
    };

    const renderNote = ({ item }: any) => {
        return (
            <View key={item.noteId} style={styles.noteCard}>
                {editing === item.noteId ? (
                    <>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={currentNote}
                            onChangeText={(value) => handleChange(value)}
                            placeholder="Your note in 300 char"
                            multiline
                        />
                         <View style={styles.btnGroup}>
                            <TouchableOpacity onPress={() => handleCancel()} style={styles.editBtn}>
                                <Text style={styles.btnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleSave(item.noteId)} style={styles.saveBtn}>
                                <Text style={styles.btnText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <>
                        <View style={styles.noteContent}>
                            {item.bookPhoto && <TouchableOpacity
                                onPress={() => {
                                navigation.push('Details', {
                                    id: item.bookId,
                                    type: "Book",
                                });
                            }}>
                                <Image source={{ uri: convertHttpToHttps(item.bookPhoto) }} style={styles.thumbnail} />
                            </TouchableOpacity>}
                            <View style={styles.noteTextContainer}>
                                <Text style={styles.noteText}>{item.note}</Text>
                                <Text style={styles.updatedAtText}>Updated at: {item.updatedAt}</Text>
                            </View>
                        </View>
                        <View style={styles.btnGroup}>
                            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editBtn}>
                                <Text style={styles.btnText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(item.noteId)} style={styles.deleteBtn}>
                                <Text style={styles.btnText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <HeaderBar showBackButton={true} title='My notes' />
            <FlatList
                data={notes}
                keyExtractor={(item) => item.noteId.toString()}
                renderItem={renderNote}
                contentContainerStyle={styles.container}
                onEndReached={() => fetchNotes(false)}
                onEndReachedThreshold={0.5}  // Trigger when 50% of the list is visible
                ListFooterComponent={loading && <ActivityIndicator size="large" color={COLORS.primaryOrangeHex} />}
                ListEmptyComponent={!loading && <Mascot emotion="reading" />}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.primaryBlackHex,
    },
    container: {
        padding: SPACING.space_20,
        backgroundColor: COLORS.primaryBlackHex,
        flexGrow: 1,
    },
    noteCard: {
        padding: SPACING.space_20,
        backgroundColor: COLORS.primaryDarkGreyHex,
        borderRadius: BORDERRADIUS.radius_10,
        marginBottom: SPACING.space_16,
    },
    noteContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    thumbnail: {
        width: 60,
        height: 60,
        borderRadius: BORDERRADIUS.radius_4,
        marginRight: SPACING.space_10,
    },
    noteTextContainer: {
        flex: 1,
    },
    noteText: {
        fontSize: FONTSIZE.size_14,
        fontFamily: FONTFAMILY.poppins_regular,
        color: COLORS.primaryWhiteHex,
        marginBottom: SPACING.space_12,
    },
    updatedAtText: {
        fontSize: FONTSIZE.size_12,
        fontFamily: FONTFAMILY.poppins_regular,
        color: COLORS.secondaryLightGreyHex,
        alignSelf: 'flex-end',
        marginBottom: SPACING.space_12,
    },
    input: {
        width: '100%',
        padding: SPACING.space_10,
        marginBottom: SPACING.space_12,
        borderRadius: BORDERRADIUS.radius_8,
        backgroundColor: COLORS.primaryBlackRGBA,
        borderColor: COLORS.primaryLightGreyHex,
        borderWidth: 1,
        fontFamily: FONTFAMILY.poppins_medium,
        color: COLORS.primaryWhiteHex,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    btnGroup: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    saveBtn: {
        backgroundColor: COLORS.primaryOrangeHex,
        padding: SPACING.space_8,
        borderRadius: BORDERRADIUS.radius_8,
        alignItems: 'center',
        marginVertical: SPACING.space_10,
    },
    editBtn: {
        backgroundColor: COLORS.primaryGreyHex,
        padding: SPACING.space_8,
        borderRadius: BORDERRADIUS.radius_8,
        alignItems: 'center',
        marginRight: SPACING.space_10,
    },
    deleteBtn: {
        backgroundColor: COLORS.primaryRedHex,
        padding: SPACING.space_8,
        borderRadius: BORDERRADIUS.radius_8,
        alignItems: 'center',
    },
    btnText: {
        fontSize: FONTSIZE.size_14,
        fontFamily: FONTFAMILY.poppins_medium,
        color: COLORS.primaryWhiteHex,
    }
});

export default NotesScreen;