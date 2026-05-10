import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { FolderHeart } from 'lucide-react-native';
import { requestVaultPermission } from '../utils/vaultSystem';
import { theme } from '../theme';

export const VaultSetupScreen = ({ navigation }: any) => {

  const handleSelectVault = async () => {
    const success = await requestVaultPermission();
    if (success) {
      navigation.replace('Dashboard');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <FolderHeart size={80} color={theme.colors.primary} style={styles.icon} />
        
        <Text style={styles.title}>Welcome to Your Vault</Text>
        
        <Text style={styles.description}>
          Unlike most apps, your data is 100% yours. Please choose or create a folder on your device. 
          We will save all your Markdown notes and habits directly in this folder.
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleSelectVault}>
          <Text style={styles.buttonText}>Choose Vault Folder</Text>
        </TouchableOpacity>
        
        {Platform.OS !== 'android' && (
          <Text style={styles.warningText}>
            Local folder selection is fully supported on Android. On iOS/Web, an internal sandbox will be used.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
  },
  warningText: {
    marginTop: theme.spacing.xl,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    textAlign: 'center',
  }
});
