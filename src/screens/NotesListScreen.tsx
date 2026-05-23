// @ts-nocheck
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity,
  FlatList, StatusBar, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getNotesList, NoteMetadata } from '../utils/fileSystem';
import { mindfulTheme as mt } from '../theme';
import { BottomNav } from '../components/BottomNav';
import { Search, Grid, List as ListIcon, Plus, User } from 'lucide-react-native';

export const NotesListScreen = ({ navigation }: any) => {
  const [notes, setNotes] = useState<NoteMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGrid, setIsGrid] = useState(false);

  const loadNotes = async () => {
    const list = await getNotesList();
    setNotes(list);
  };

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [])
  );

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.preview && n.preview.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (n.tags && n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const renderNoteCard = ({ item }: { item: NoteMetadata }) => {
    return (
      <TouchableOpacity 
        style={[s.card, isGrid ? s.cardGrid : s.cardList]}
        onPress={() => navigation.navigate('NoteEditor', { uri: item.uri, filename: item.filename })}
        activeOpacity={0.7}
      >
        <Text style={s.cardTitle}>{item.title}</Text>
        {item.preview ? <Text style={s.cardPreview} numberOfLines={isGrid ? 5 : 3}>{item.preview}</Text> : null}
        
        {item.tags && item.tags.length > 0 && (
          <View style={s.tagsContainer}>
            {item.tags.map((tag, idx) => (
              <View key={idx} style={s.tagChip}>
                <Text style={s.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={mt.colors.background} />
      
      {/* ── Google Keep Style Header ── */}
      <View style={s.header}>
        <View style={s.searchBar}>
          <Search color={mt.colors.textSecondary} size={20} style={{ marginHorizontal: 12 }} />
          <TextInput
            style={s.searchInput}
            placeholder="Search your notes"
            placeholderTextColor={mt.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity onPress={() => setIsGrid(!isGrid)} style={s.iconBtn}>
            {isGrid ? <ListIcon color={mt.colors.textSecondary} size={22} /> : <Grid color={mt.colors.textSecondary} size={22} />}
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn}>
            <View style={s.avatar}>
              <User color="#FFF" size={16} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Notes List ── */}
      <FlatList
        key={isGrid ? 'grid' : 'list'}
        data={filteredNotes}
        keyExtractor={item => item.uri}
        renderItem={renderNoteCard}
        numColumns={isGrid ? 2 : 1}
        contentContainerStyle={s.listContent}
        columnWrapperStyle={isGrid ? s.row : undefined}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={s.emptyText}>
            {searchQuery ? 'No matching notes found.' : 'Your vault is empty. Tap + to start writing.'}
          </Text>
        }
      />

      {/* ── FAB ── */}
      <TouchableOpacity 
        style={s.fab} 
        onPress={() => navigation.navigate('NoteEditor', {})}
        activeOpacity={0.8}
      >
        <Plus color="#FFF" size={32} />
      </TouchableOpacity>

      <BottomNav current="notes" />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' }, // Slightly off-white like Keep
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 12,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDEEF0',
    borderRadius: 24,
    height: 48,
    elevation: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: mt.colors.textPrimary,
  },
  iconBtn: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: mt.colors.accentTeal,
    alignItems: 'center', justifyContent: 'center',
  },
  listContent: {
    padding: 12,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardList: {
    width: '100%',
  },
  cardGrid: {
    width: '48%',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: mt.colors.textPrimary,
    marginBottom: 8,
  },
  cardPreview: {
    fontSize: 14,
    color: mt.colors.textSecondary,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 6,
  },
  tagChip: {
    backgroundColor: '#EAEAEA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    color: '#5F6368',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: mt.colors.textSecondary,
    marginTop: 40,
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    backgroundColor: '#1A73E8', // Google Blue
    width: 60,
    height: 60,
    borderRadius: 20, // Squircle shape like modern material
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
