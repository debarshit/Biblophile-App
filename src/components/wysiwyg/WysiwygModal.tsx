import React, { useState, useRef } from 'react';
import { 
  View, 
  Modal, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { WysiwygEditor } from './WysiwygEditor';
import { COLORS, SPACING, FONTFAMILY, FONTSIZE } from '../../theme/theme';
import { WysiwygTrigger } from './WysiwygTrigger';

type WysiwygModalProps = {
  visible: boolean;
  value?: string;
  onChange?: (html: string) => void;
  onClose: () => void;
  title?: string;
  maxChars?: number;
  placeholder?: string;
};

export function WysiwygModal({
  visible,
  value = '',
  onChange,
  onClose,
  title = 'Edit Content',
  maxChars = 5000,
  placeholder
}: WysiwygModalProps) {
  const [currentValue, setCurrentValue] = useState(value);

  const handleSave = () => {
    onChange?.(currentValue);
    onClose();
  };

  const handleCancel = () => {
    setCurrentValue(value); // Reset to original value
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>{title}</Text>
          
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView 
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <WysiwygEditor
            value={currentValue}
            onChange={setCurrentValue}
            maxChars={maxChars}
            style={styles.editor} // Allow custom styling
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// Usage Hook
export function useWysiwygEditor(initialValue = '') {
  const [isVisible, setIsVisible] = useState(false);
  const [value, setValue] = useState(initialValue);

  const openEditor = () => setIsVisible(true);
  const closeEditor = () => setIsVisible(false);

  const EditorTrigger = ({ placeholder, maxLines }: { placeholder?: string; maxLines?: number }) => (
    <WysiwygTrigger
      value={value}
      placeholder={placeholder}
      onPress={openEditor}
      maxLines={maxLines}
    />
  );

  const EditorModal = ({ title, maxChars }: { title?: string; maxChars?: number }) => (
    <WysiwygModal
      visible={isVisible}
      value={value}
      onChange={setValue}
      onClose={closeEditor}
      title={title}
      maxChars={maxChars}
    />
  );

  return {
    value,
    setValue,
    isVisible,
    openEditor,
    closeEditor,
    EditorTrigger,
    EditorModal,
  };
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.primaryBlackHex,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryGreyHex,
  },
  cancelText: {
    color: COLORS.secondaryLightGreyHex,
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_16,
  },
  title: {
    color: COLORS.primaryWhiteHex,
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_18,
  },
  saveText: {
    color: COLORS.primaryOrangeHex,
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
  },
  content: {
    flex: 1,
    padding: SPACING.space_16,
  },
  editor: {
    flex: 1,
    height: 'auto',
  },
});