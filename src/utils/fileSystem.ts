// @ts-nocheck
import * as FileSystem from 'expo-file-system/legacy';
import { getNotesDirUri } from './vaultSystem';
import { Platform } from 'react-native';

export interface NoteMetadata {
  filename: string;
  title: string;
  updatedAt: number;
  uri: string;
}

export const getNotesList = async (): Promise<NoteMetadata[]> => {
  const notesDirUri = await getNotesDirUri();
  
  let files: string[] = [];
  if (Platform.OS === 'android') {
    files = await FileSystem.StorageAccessFramework.readDirectoryAsync(notesDirUri);
  } else {
    const rawFiles = await FileSystem.readDirectoryAsync(notesDirUri);
    files = rawFiles.map(f => `${notesDirUri}${f}`);
  }
  
  const notesMetadata: NoteMetadata[] = [];
  
  for (const uri of files) {
    const decodedUri = decodeURIComponent(uri);
    // SAF URIs usually contain the filename at the very end
    const filename = decodedUri.split('/').pop()?.split(':').pop() || 'unknown.md';
    if (!filename.endsWith('.md')) continue;

    const fileInfo = await FileSystem.getInfoAsync(uri);
    notesMetadata.push({
      filename: filename,
      title: filename.replace('.md', ''),
      updatedAt: fileInfo.exists ? (fileInfo.modificationTime || Date.now()) : Date.now(),
      uri: uri
    });
  }
  
  return notesMetadata.sort((a, b) => b.updatedAt - a.updatedAt);
};

export const saveNote = async (title: string, content: string, existingUri?: string) => {
  if (existingUri) {
    await FileSystem.writeAsStringAsync(existingUri, content, { encoding: 'utf8' });
    return existingUri;
  }

  const notesDirUri = await getNotesDirUri();
  const filename = title.replace(/[^a-zA-Z0-9]/gi, '_').toLowerCase() + '.md';
  
  if (Platform.OS === 'android') {
    const files = await FileSystem.StorageAccessFramework.readDirectoryAsync(notesDirUri);
    const existing = files.find(u => decodeURIComponent(u).endsWith(filename) || decodeURIComponent(u).endsWith(`:${filename}`));
    
    if (existing) {
      await FileSystem.writeAsStringAsync(existing, content, { encoding: 'utf8' });
      return existing;
    }
    
    const newUri = await FileSystem.StorageAccessFramework.createFileAsync(notesDirUri, filename, 'text/markdown');
    await FileSystem.writeAsStringAsync(newUri, content, { encoding: 'utf8' });
    return newUri;
  } else {
    const path = `${notesDirUri}${filename}`;
    await FileSystem.writeAsStringAsync(path, content, { encoding: 'utf8' });
    return path;
  }
};

export const readNote = async (uri: string) => {
  return await FileSystem.readAsStringAsync(uri, { encoding: 'utf8' });
};

export const deleteNote = async (uri: string) => {
  await FileSystem.deleteAsync(uri, { idempotent: true });
};
