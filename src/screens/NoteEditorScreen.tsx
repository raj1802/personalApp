// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { readNote, saveNote, deleteNote } from '../utils/fileSystem';
import { theme } from '../theme';
import { Save, Trash2, ArrowLeft, Bold, Italic, Link, Code, List, Quote, Smile, Eye, Edit2 } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';

export const NoteEditorScreen = ({ route, navigation }: any) => {
  const { filename, uri } = route.params || {};
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (uri) {
      loadNote(uri);
    }
  }, [uri]);

  const loadNote = async (noteUri: string) => {
    const fileContent = await readNote(noteUri);
    setContent(fileContent);
    if (filename) setTitle(filename.replace('.md', ''));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    await saveNote(title, content, uri);
    navigation.goBack();
  };

  const handleDelete = async () => {
    if (uri) {
      Alert.alert('Delete Note', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteNote(uri);
          navigation.goBack();
        }}
      ]);
    } else {
      navigation.goBack();
    }
  };

  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [isPreview, setIsPreview] = useState(false);

  const insertFormatting = (prefix: string, suffix: string = '') => {
    const { start, end } = selection;
    const selectedText = content.substring(start, end);
    const newContent = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);
    setContent(newContent);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <ArrowLeft size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <TextInput
          style={styles.titleInput}
          placeholder="Note Title..."
          placeholderTextColor={theme.colors.textSecondary}
          value={title}
          onChangeText={setTitle}
          editable={!uri} // Lock title if existing note
        />
        <TouchableOpacity onPress={() => setIsPreview(!isPreview)} style={styles.iconButton}>
          {isPreview ? <Edit2 size={24} color={theme.colors.textPrimary} /> : <Eye size={24} color={theme.colors.textPrimary} />}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.editorContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {isPreview ? (
          <ScrollView style={styles.previewContainer}>
            <Markdown>{content || '*Nothing to preview*'}</Markdown>
          </ScrollView>
        ) : (
          <TextInput
            style={styles.contentInput}
            placeholder="Start typing in Markdown..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            textAlignVertical="top"
            value={content}
            onChangeText={setContent}
            onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
          />
        )}
        <View style={styles.toolbar}>
          {!isPreview ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={styles.formattingBar}>
              <TouchableOpacity onPress={() => insertFormatting('**', '**')} style={styles.toolbarButton}>
                <Bold size={20} color={theme.colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => insertFormatting('*', '*')} style={styles.toolbarButton}>
                <Italic size={20} color={theme.colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => insertFormatting('[', '](url)')} style={styles.toolbarButton}>
                <Link size={20} color={theme.colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => insertFormatting('`', '`')} style={styles.toolbarButton}>
                <Code size={20} color={theme.colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => insertFormatting('- ')} style={styles.toolbarButton}>
                <List size={20} color={theme.colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => insertFormatting('> ')} style={styles.toolbarButton}>
                <Quote size={20} color={theme.colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => insertFormatting('😊')} style={styles.toolbarButton}>
                <Smile size={20} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <View style={{flex: 1}} />
          )}

          <View style={styles.actionButtons}>
            {uri && (
              <TouchableOpacity onPress={handleDelete} style={[styles.toolbarButton, { marginRight: theme.spacing.sm, borderColor: theme.colors.danger }]}>
                <Trash2 size={20} color={theme.colors.danger} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleSave} style={[styles.toolbarButton, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}>
              <Save size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  iconButton: {
    padding: theme.spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
  },
  titleInput: {
    flex: 1,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textPrimary,
    marginHorizontal: theme.spacing.sm,
  },
  editorContainer: {
    flex: 1,
  },
  contentInput: {
    flex: 1,
    padding: theme.spacing.lg,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textPrimary,
    lineHeight: 24,
  },
  previewContainer: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  toolbar: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  formattingBar: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarButton: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.xs,
  }
});
