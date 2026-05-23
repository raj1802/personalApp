// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, 
  KeyboardAvoidingView, Platform, StatusBar, ScrollView 
} from 'react-native';
import { readNote, saveNote } from '../utils/fileSystem';
import { mindfulTheme as mt } from '../theme';
import { ArrowLeft, Pin, Bell, Archive, PlusSquare, Palette, Type, MoreVertical } from 'lucide-react-native';

export const NoteEditorScreen = ({ route, navigation }: any) => {
  const initialUri = route.params?.uri;
  const initialFilename = route.params?.filename;
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [uri, setUri] = useState<string | null>(initialUri || null);

  // Prevent auto-save from running on the very first render before loading data
  const isLoaded = useRef(initialUri ? false : true);

  useEffect(() => {
    if (initialUri) {
      loadNote(initialUri);
    }
  }, [initialUri]);

  const loadNote = async (noteUri: string) => {
    const fileContent = await readNote(noteUri);
    setContent(fileContent);
    if (initialFilename) {
      setTitle(initialFilename.replace('.md', ''));
    }
    isLoaded.current = true;
  };

  // Auto-save mechanism (debounced 1.5 seconds)
  useEffect(() => {
    if (!isLoaded.current) return;
    if (!title.trim() && !content.trim()) return; // Don't save completely empty new notes

    const delayDebounceFn = setTimeout(async () => {
      const actualTitle = title.trim() || 'Untitled';
      const newUri = await saveNote(actualTitle, content, uri || undefined);
      if (!uri && newUri) {
        setUri(newUri);
      }
    }, 1500);

    return () => clearTimeout(delayDebounceFn);
  }, [title, content]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <ArrowLeft size={24} color="#5F6368" />
        </TouchableOpacity>
        
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Pin size={22} color="#5F6368" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Bell size={22} color="#5F6368" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Archive size={22} color="#5F6368" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.editorContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled">
          {/* ── Title Input ── */}
          <TextInput
            style={styles.titleInput}
            placeholder="Title"
            placeholderTextColor="#80868B"
            value={title}
            onChangeText={setTitle}
            editable={!initialUri} // Often in these apps, renaming requires a different flow if it's based on filename, but let's lock it if it exists to match old behavior
          />
          
          {/* ── Content Input ── */}
          <TextInput
            style={styles.contentInput}
            placeholder="Note"
            placeholderTextColor="#80868B"
            multiline
            textAlignVertical="top"
            value={content}
            onChangeText={setContent}
            autoFocus={!initialUri}
          />
        </ScrollView>

        {/* ── Bottom Toolbar ── */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarLeft}>
            <TouchableOpacity style={styles.bottomIcon}>
              <PlusSquare size={20} color="#5F6368" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomIcon}>
              <Palette size={20} color="#5F6368" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomIcon}>
              <Type size={20} color="#5F6368" />
            </TouchableOpacity>
          </View>
          <Text style={styles.editedText}>Edited just now</Text>
          <TouchableOpacity style={styles.bottomIcon}>
            <MoreVertical size={20} color="#5F6368" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 8,
    height: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 56 : 56,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 12,
  },
  editorContainer: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleInput: {
    fontSize: 22,
    color: '#202124',
    paddingVertical: 12,
    fontWeight: 'normal',
  },
  contentInput: {
    fontSize: 16,
    color: '#202124',
    lineHeight: 24,
    minHeight: 200,
    paddingBottom: 40,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F4',
    backgroundColor: '#FFFFFF',
  },
  bottomBarLeft: {
    flexDirection: 'row',
  },
  bottomIcon: {
    padding: 12,
  },
  editedText: {
    fontSize: 12,
    color: '#5F6368',
    flex: 1,
    textAlign: 'center',
  }
});
