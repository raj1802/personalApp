// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '../screens/DashboardScreen';
import { NoteEditorScreen } from '../screens/NoteEditorScreen';
import { HabitsScreen } from '../screens/HabitsScreen';
import { VaultSetupScreen } from '../screens/VaultSetupScreen';
import { getVaultUri } from '../utils/vaultSystem';
import { View, ActivityIndicator } from 'react-native';
import { theme } from '../theme';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    const checkVault = async () => {
      const uri = await getVaultUri();
      setInitialRoute(uri ? 'Dashboard' : 'VaultSetup');
    };
    checkVault();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        id={undefined}
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background }
        }}
      >
        <Stack.Screen name="VaultSetup" component={VaultSetupScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="NoteEditor" component={NoteEditorScreen} />
        <Stack.Screen name="Habits" component={HabitsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
