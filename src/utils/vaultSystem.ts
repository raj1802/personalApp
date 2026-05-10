import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const VAULT_KEY = 'VAULT_URI';

export const getVaultUri = async () => {
  if (Platform.OS !== 'android') return FileSystem.documentDirectory; // Fallback for iOS/Web
  return await SecureStore.getItemAsync(VAULT_KEY);
};

export const setVaultUri = async (uri: string) => {
  if (Platform.OS !== 'android') return;
  await SecureStore.setItemAsync(VAULT_KEY, uri);
};

export const clearVaultUri = async () => {
  if (Platform.OS !== 'android') return;
  await SecureStore.deleteItemAsync(VAULT_KEY);
};

export const requestVaultPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (permissions.granted) {
    await setVaultUri(permissions.directoryUri);
    return true;
  }
  return false;
};

const getOrCreateSubFolder = async (vaultUri: string, folderName: string) => {
  if (Platform.OS !== 'android') {
    const dir = `${vaultUri}${folderName}/`;
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
    return dir;
  }

  const files = await FileSystem.StorageAccessFramework.readDirectoryAsync(vaultUri);
  // Decode URI and split to get the exact folder name at the end, handling both possible SAF formats
  const existingFolderUri = files.find(f => {
    const decoded = decodeURIComponent(f);
    return decoded.endsWith(`/${folderName}`) || decoded.endsWith(`%2F${folderName}`) || decoded.endsWith(`:${folderName}`);
  });
  
  if (existingFolderUri) {
    return existingFolderUri;
  }
  
  return await FileSystem.StorageAccessFramework.makeDirectoryAsync(vaultUri, folderName);
};

export const getNotesDirUri = async () => {
  const vaultUri = await getVaultUri();
  if (!vaultUri) throw new Error("Vault not configured");
  return await getOrCreateSubFolder(vaultUri, 'notes');
};

export const getHabitsDirUri = async () => {
  const vaultUri = await getVaultUri();
  if (!vaultUri) throw new Error("Vault not configured");
  return await getOrCreateSubFolder(vaultUri, 'habits');
};

export const getBudgetDirUri = async () => {
  const vaultUri = await getVaultUri();
  if (!vaultUri) throw new Error("Vault not configured");
  return await getOrCreateSubFolder(vaultUri, 'budget');
};
