import * as FileSystem from 'expo-file-system/legacy';

const NOTES_DIR = `${FileSystem.documentDirectory}notes/`;
const IMAGES_DIR = `${FileSystem.documentDirectory}images/`;

export const initFileSystem = async () => {
  const notesDirInfo = await FileSystem.getInfoAsync(NOTES_DIR);
  if (!notesDirInfo.exists) {
    await FileSystem.makeDirectoryAsync(NOTES_DIR, { intermediates: true });
  }

  const imagesDirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
  if (!imagesDirInfo.exists) {
    await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
  }
};

export interface NoteMetadata {
  filename: string;
  title: string;
  updatedAt: number;
}

export const getNotesList = async (): Promise<NoteMetadata[]> => {
  await initFileSystem();
  const files = await FileSystem.readDirectoryAsync(NOTES_DIR);
  const mdFiles = files.filter(f => f.endsWith('.md'));
  
  const notesMetadata: NoteMetadata[] = [];
  
  for (const file of mdFiles) {
    const fileInfo = await FileSystem.getInfoAsync(`${NOTES_DIR}${file}`, { md5: false });
    notesMetadata.push({
      filename: file,
      title: file.replace('.md', ''),
      updatedAt: fileInfo.exists ? (fileInfo.modificationTime || Date.now()) : Date.now(),
    });
  }
  
  // Sort by most recent
  return notesMetadata.sort((a, b) => b.updatedAt - a.updatedAt);
};

export const saveNote = async (title: string, content: string) => {
  await initFileSystem();
  // Basic sanitization for filename
  const filename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const path = `${NOTES_DIR}${filename}.md`;
  await FileSystem.writeAsStringAsync(path, content, { encoding: 'utf8' });
  return filename;
};

export const readNote = async (filename: string) => {
  const path = `${NOTES_DIR}${filename}`; // filename should include .md if passed directly, or we can enforce it.
  const actualPath = filename.endsWith('.md') ? path : `${path}.md`;
  return await FileSystem.readAsStringAsync(actualPath, { encoding: 'utf8' });
};

export const deleteNote = async (filename: string) => {
  const actualPath = filename.endsWith('.md') ? `${NOTES_DIR}${filename}` : `${NOTES_DIR}${filename}.md`;
  await FileSystem.deleteAsync(actualPath, { idempotent: true });
};
