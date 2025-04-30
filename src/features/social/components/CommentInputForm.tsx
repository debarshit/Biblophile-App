// import React from 'react';
// import { StyleSheet, View, TextInput, TouchableOpacity, Text } from 'react-native';
// import { SPACING, COLORS, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../theme/theme';

// interface Props {
//   value: string;
//   onChangeText: (text: string) => void;
//   onSubmit: () => void;
//   placeholder: string;
// }

// export const CommentInputForm: React.FC<Props> = ({ value, onChangeText, onSubmit, placeholder }) => {
//   return (
//     <View style={styles.container}>
//       <TextInput
//         style={styles.input}
//         value={value}
//         onChangeText={onChangeText}
//         placeholder={placeholder}
//         placeholderTextColor={COLORS.primaryLightGreyHex}
//         multiline
//       />
//       <TouchableOpacity style={styles.button} onPress={onSubmit}>
//         <Text style={styles.buttonText}>Post</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: SPACING.space_15,
//   },
//   input: {
//     flex: 1,
//     backgroundColor: COLORS.primaryGreyHex,
//     color: COLORS.primaryLightGreyHex,
//     borderRadius: BORDERRADIUS.radius_8,
//     padding: SPACING.space_12,
//     fontSize: FONTSIZE.size_14,
//     fontFamily: FONTFAMILY.poppins_regular,
//     marginRight: SPACING.space_10,
//     maxHeight: 100,
//   },
//   button: {
//     backgroundColor: COLORS.primaryOrangeHex,
//     paddingVertical: SPACING.space_12,
//     paddingHorizontal: SPACING.space_15,
//     borderRadius: BORDERRADIUS.radius_8,
//   },
//   buttonText: {
//     color: COLORS.primaryWhiteHex,
//     fontFamily: FONTFAMILY.poppins_semibold,
//     fontSize: FONTSIZE.size_14,
//   },
// });

import React, { useState, memo, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text } from 'react-native';
import { SPACING, COLORS, FONTFAMILY, FONTSIZE, BORDERRADIUS } from '../../../theme/theme';

interface UnifiedCommentFormProps {
  onSubmit: (text: string, pageNumber?: number) => void;
  isLoading?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  initialPageNumber?: number;
  placeholder?: string;
  showPageInput?: boolean;
  buttonText?: string;
  resetAfterSubmit?: boolean;
}

export const CommentInputForm = memo(({
  onSubmit,
  isLoading = false,
  value = '',
  onChangeText,
  initialPageNumber = 1,
  placeholder = 'Write a comment...',
  showPageInput = false,
  buttonText = 'Post',
  resetAfterSubmit = true,
}: UnifiedCommentFormProps) => {
  const [commentText, setCommentText] = useState(value);
  const [pageNumber, setPageNumber] = useState(initialPageNumber);

  useEffect(() => {
    setCommentText(value);
  }, [value]);
  
  useEffect(() => {
    setPageNumber(initialPageNumber);
  }, [initialPageNumber]);
  
  const handleTextChange = (text: string) => {
    setCommentText(text);
    if (onChangeText) {
      onChangeText(text);
    }
  };
  
  const isValid = commentText.trim() !== '' && (!showPageInput || pageNumber > 0);
  
  const handleSubmit = () => {
    if (isValid && !isLoading) {
      if (showPageInput) {
        onSubmit(commentText, pageNumber);
      } else {
        onSubmit(commentText);
      }
      
      if (resetAfterSubmit) {
        setCommentText('');
        setPageNumber(initialPageNumber);
      }
    }
  };
  
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.primaryLightGreyHex}
        value={commentText}
        onChangeText={setCommentText}
        multiline={true}
      />
      
      {showPageInput && (
        <TextInput
          style={styles.pageInput}
          placeholder="Page"
          placeholderTextColor={COLORS.secondaryLightGreyHex}
          keyboardType="numeric"
          value={pageNumber === 0 ? '' : pageNumber.toString()}
          onChangeText={(text) => setPageNumber(parseInt(text) || 0)}
        />
      )}
      
      <TouchableOpacity
        style={[styles.button, !isValid && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={isLoading || !isValid}
      >
        <Text style={styles.buttonText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_8,
  },
  input: {
    flex: 1,
    paddingHorizontal: SPACING.space_12,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_10,
    borderWidth: 1,
    borderColor: COLORS.secondaryLightGreyHex,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    minHeight: 40,
  },
  pageInput: {
    width: 60,
    marginLeft: SPACING.space_8,
    paddingHorizontal: SPACING.space_8,
    paddingVertical: SPACING.space_4,
    borderRadius: BORDERRADIUS.radius_10,
    borderWidth: 1,
    borderColor: COLORS.secondaryLightGreyHex,
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_14,
    textAlign: 'center',
  },
  button: {
    marginLeft: SPACING.space_8,
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_8,
    borderRadius: BORDERRADIUS.radius_10,
    backgroundColor: COLORS.primaryOrangeHex,
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
  },
  disabledButton: {
    opacity: 0.6,
  },
  
});