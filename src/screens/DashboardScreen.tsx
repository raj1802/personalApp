import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { getNotesList, saveNote, NoteMetadata } from '../utils/fileSystem';
import { theme } from '../theme';
import { Plus, FileText, Download, Activity } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

export const DashboardScreen = ({ navigation }: any) => {
  const [notes, setNotes] = useState<NoteMetadata[]>([]);

  useEffect(() => {
    const loadNotes = navigation.addListener('focus', async () => {
      const loadedNotes = await getNotesList();
      setNotes(loadedNotes);
    });

    return loadNotes;
  }, [navigation]);

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'text/markdown'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        let filename = result.assets[0].name;
        
        // Ensure it has .md extension
        if (filename.endsWith('.txt')) {
          filename = filename.replace('.txt', '.md');
        } else if (!filename.endsWith('.md')) {
          filename = filename + '.md';
        }

        const content = await FileSystem.readAsStringAsync(fileUri, { encoding: 'utf8' });
        
        // Save using our utility (removes .md inside saveNote)
        await saveNote(filename.replace('.md', ''), content);
        
        // Refresh list
        const loadedNotes = await getNotesList();
        setNotes(loadedNotes);
      }
    } catch (error) {
      console.error("Error importing file:", error);
    }
  };

  const renderItem = ({ item }: { item: NoteMetadata }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('NoteEditor', { uri: item.uri, filename: item.filename })}
    >
      <View style={styles.cardHeader}>
        <FileText size={20} color={theme.colors.primary} />
        <Text style={styles.cardTitle}>{item.title}</Text>
      </View>
      <Text style={styles.cardDate}>
        {new Date(item.updatedAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Vault</Text>
      </View>
      
      <FlatList
        data={notes}
        keyExtractor={(item) => item.filename}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No notes yet. Create one!</Text>
          </View>
        }
      />

      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={() => navigation.navigate('Habits')} style={styles.bottomBarButton}>
          <Activity size={24} color={theme.colors.textPrimary} />
          <Text style={styles.bottomBarText}>Habits</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigation.navigate('NoteEditor')} style={styles.fab}>
          <Plus color="#FFFFFF" size={28} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleImport} style={styles.bottomBarButton}>
          <Download size={24} color={theme.colors.textPrimary} />
          <Text style={styles.bottomBarText}>Import</Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl, 
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
  },
  cardDate: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyStateText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.md,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  bottomBarButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
    minWidth: 70,
  },
  bottomBarText: {
    fontSize: 12,
    marginTop: 4,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  fab: {
    backgroundColor: theme.colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    marginTop: -30, 
  }
});
