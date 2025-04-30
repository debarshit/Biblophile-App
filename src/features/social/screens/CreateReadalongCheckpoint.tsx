import {
    StyleSheet,
    Text,
    View,
    TextInput,
    Pressable,
    ActivityIndicator,
    ScrollView,
    Alert,
    Platform,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import instance from '../../../services/axios';
import requests from '../../../services/requests';

// --- Interface Definitions (Ensure consistency) ---
interface Member {
    name: string;
    userId: string;
}
  
interface CurrentUser {
    userId: string | null;
    readingStatus: string | null;
    currentPage: number;
}
interface Readalong {
    readalong_id: number;
    book_id: string;
    book_title: string;
    book_photo: string;
    book_pages: number;
    readalong_description: string;
    start_date: string;
    end_date: string;
    max_members: number;
    members: Member[];
    host: Member;
  }
// -------------------------------------------------------------------------

type CreateCheckpointRouteParams = {
    readalong: Readalong;
    checkpoint: {
        checkpointId: number | null;
        pageNumber: number | null;
        description: string | null;
        date: string | null;
    };
    currentUser: CurrentUser;
    isHost: boolean;
};

type CreateCheckpointScreenRouteProp = RouteProp<{ CreateCheckpointScreen: CreateCheckpointRouteParams }, 'CreateCheckpointScreen'>;



const CreateReadalongCheckpoint: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute<CreateCheckpointScreenRouteProp>();
    const { 
        readalong, 
        checkpoint = { checkpointId: null, pageNumber: null, description: null, date: null }, 
        currentUser, 
        isHost 
    } = route.params;

    // --- Form State ---
    const [pageNumber, setPageNumber] = useState<string>('');
    const [discussionPrompt, setDiscussionPrompt] = useState('');
    const [discussionDate, setDiscussionDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // --- UI State ---
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [initialLoadError, setInitialLoadError] = useState<string | null>(null);

    const [hostStatus, setHostStatus] = useState<boolean | null>(isHost ?? null);
    const [maxBookPages, setMaxBookPages] = useState<number | null>(readalong?.book_pages ?? null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(currentUser?.userId ?? null);

    // --- Effect to fetch existing checkpoint data (if updating) and initial context data ---
    useEffect(() => {
         const fetchData = async () => {
             setInitialLoading(true);
             setInitialLoadError(null);
             try {
                  if (checkpoint.checkpointId) {
                      setPageNumber(checkpoint.pageNumber?.toString() || '');
                      setDiscussionPrompt(checkpoint.description || '');
                      setDiscussionDate(checkpoint.date ? new Date(checkpoint.date) : new Date());
                  }

             } catch (error) {
                 console.error("Error fetching initial data:", error);
                 setInitialLoadError("Failed to load data for the form.");
             } finally {
                 setInitialLoading(false);
             }
         };
         fetchData();

    }, [checkpoint.checkpointId]);

    // --- Date Picker Handlers ---
    const onChangeDate = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || discussionDate;
        setShowDatePicker(Platform.OS === 'ios');
        setDiscussionDate(currentDate);
    };

    const showDatepicker = () => {
        setShowDatePicker(true);
    };

     // --- Form Submission Handler ---
    const handleSubmit = async () => {
         setSubmitting(true);
         setFormError(null);

         // --- Basic Validation ---
         if (hostStatus === false) {
             setFormError("You must be the host to create/update a checkpoint.");
             setSubmitting(false);
             return;
         }
         if (!pageNumber || parseInt(pageNumber) <= 0) {
              setFormError("Page number must be a positive number.");
              setSubmitting(false);
              return;
         }
         const pageNum = parseInt(pageNumber);
         if (maxBookPages !== null && pageNum > maxBookPages) {
             setFormError(`Page number cannot exceed the book's total pages (${maxBookPages}).`);
             setSubmitting(false);
             return;
         }
         if (!discussionDate) {
              setFormError("Please select a discussion date.");
              setSubmitting(false);
              return;
         }
         if (!currentUserId) {
             setFormError("User ID is missing. Cannot submit.");
             setSubmitting(false);
             return;
         }
         if (!readalong.readalong_id) {
             setFormError("Readalong ID is missing. Cannot submit.");
             setSubmitting(false);
             return;
         }

         // --- Prepare Payload ---
         const payload = {
             readalongId: parseInt(readalong.readalong_id.toString()),
             checkpointId: checkpoint.checkpointId || null,
             userId: currentUserId,
             pageNumber: pageNum, // Send as number
             discussionPrompt: discussionPrompt.trim() || null,
             discussionDate: discussionDate.toISOString().split('T')[0],
         };

         try {
             // Use your axios instance and requests object
             const response = await instance.post(`${requests.createOrUpdateReadalongCheckpoints}`, payload);

             const data = response.data;

             if (data.success) {
                 Alert.alert("Success", checkpoint.checkpointId ? "Checkpoint updated successfully!" : "Checkpoint created successfully!");
                 navigation.goBack();
             } else {
                 setFormError(data.error || data.message || "An unknown error occurred.");
             }
         } catch (error: any) {
             console.error("Submission Error:", error);
             setFormError(error.response?.data?.error || error.message || "Failed to send the request. Please try again.");
         } finally {
             setSubmitting(false);
         }
    };

    // --- Render Logic ---

    // Show loading or error messages during initial data fetch
     if (initialLoading) {
         return (
             <View style={styles.centeredMessage}>
                 <ActivityIndicator size="large" color="#ffffff" />
                 <Text style={styles.loadingText}>Loading form data...</Text>
             </View>
         );
     }

     if (initialLoadError) {
         return (
             <View style={styles.centeredMessage}>
                 <Text style={styles.errorText}>{initialLoadError}</Text>
                 {/* Optional: Retry button */}
                 {/* <Pressable style={styles.retryButton} onPress={fetchData}> ... </Pressable> */}
             </View>
         );
     }

     // If user is not host, show permission denied message
     if (hostStatus === false) {
          return (
               <View style={styles.centeredMessage}>
                   <Text style={styles.errorText}>You must be the host to create or update checkpoints.</Text>
               </View>
          );
     }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Text style={styles.title}>
                {checkpoint.checkpointId ? "Edit Checkpoint" : "Create New Checkpoint"}
            </Text>

            {/* Display form-level error */}
            {formError && <Text style={styles.errorText}>{formError}</Text>}

            {/* Page Number Field */}
            <View style={styles.formGroup}>
                <Text style={styles.label}>Page Number</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={pageNumber}
                    onChangeText={setPageNumber}
                    placeholder="e.g., 50"
                    placeholderTextColor="#a0aec0"
                />
                {maxBookPages !== null && (
                     <Text style={styles.helpText}>Max page number: {maxBookPages}</Text>
                )}
            </View>

            {/* Discussion Prompt */}
            <View style={styles.formGroup}>
                <Text style={styles.label}>Discussion Prompt</Text>
                <TextInput
                    style={[styles.input, styles.textarea]}
                    multiline={true}
                    value={discussionPrompt}
                    onChangeText={setDiscussionPrompt}
                    placeholder="Optional. For example 'What do you think...'"
                    placeholderTextColor="#a0aec0"
                />
            </View>

            {/* Discussion Date Field (requires DatePicker) */}
            <View style={styles.formGroup}>
                <Text style={styles.label}>Discussion Date</Text>
                {/* Display selected date */}
                <Pressable onPress={showDatepicker} style={styles.dateDisplayButton}>
                    <Text style={styles.dateDisplayButtonText}>
                         {discussionDate ? discussionDate.toLocaleDateString() : 'Select Date'}
                    </Text>
                </Pressable>

                {/* Date Picker */}
                {showDatePicker && (
                    <DateTimePicker
                        testID="dateTimePicker"
                        value={discussionDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onChangeDate}
                        minimumDate={new Date()}
                    />
                )}
                 <Text style={styles.helpText}>
                   Set a discussion date. If left blank, it will activate now. (Date picker defaults to today)
                 </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
                <Pressable
                    style={styles.submitButton}
                    onPress={handleSubmit}
                    disabled={submitting || !isHost}
                >
                    {submitting ? (
                         <ActivityIndicator size="small" color="#ffffff" />
                     ) : (
                        <Text style={styles.buttonText}>
                            {checkpoint.checkpointId ? "Save Changes" : "Create Checkpoint"}
                        </Text>
                     )}
                </Pressable>
                <Pressable
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()} // Use goBack
                    disabled={submitting} // Prevent canceling while submitting
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a202c', // Example background
        padding: 16,
    },
     contentContainer: {
         paddingBottom: 20, // Add some padding at the bottom for scrolling
     },
    centeredMessage: {
         flex: 1,
         justifyContent: 'center',
         alignItems: 'center',
         padding: 20,
     },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff', // Example text color
        marginBottom: 20,
        textAlign: 'center',
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#2d3748', // Example input background
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        fontSize: 16,
        color: '#ffffff', // Input text color
        borderWidth: 1,
        borderColor: '#4a5568', // Example border color
    },
    textarea: {
        minHeight: 100,
        textAlignVertical: 'top', // For multiline input on Android
    },
     dateDisplayButton: {
         backgroundColor: '#2d3748',
         borderRadius: 8,
         paddingVertical: 10,
         paddingHorizontal: 12,
         justifyContent: 'center',
         minHeight: 40,
         borderWidth: 1,
         borderColor: '#4a5568',
     },
     dateDisplayButtonText: {
         fontSize: 16,
         color: '#ffffff',
     },
    helpText: {
        fontSize: 12,
        color: '#a0aec0', // Example help text color
        marginTop: 4,
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        justifyContent: 'center', // Center buttons
    },
    submitButton: {
        backgroundColor: '#ff7e1f', // Example primary orange
        borderRadius: 20,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        minWidth: 120, // Ensure button has minimum width
    },
     buttonText: {
         color: '#ffffff', // Example text color
         fontSize: 16,
         fontWeight: 'bold',
     },
     cancelButton: {
         paddingVertical: 12,
         paddingHorizontal: 16,
     },
     cancelButtonText: {
         color: '#ffffff',
         fontSize: 16,
         textDecorationLine: 'underline',
     },
     errorText: {
        color: 'red',
        textAlign: 'center',
        marginTop: 10,
        fontSize: 14,
     },
     loadingText: {
        marginTop: 10,
        color: '#ffffff',
        fontSize: 16,
     }
});

export default CreateReadalongCheckpoint;