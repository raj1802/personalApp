// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '../screens/DashboardScreen';
import { NoteEditorScreen } from '../screens/NoteEditorScreen';
import { HabitsScreen } from '../screens/HabitsScreen';
import { HabitDetailScreen } from '../screens/HabitDetailScreen';
import { VaultSetupScreen } from '../screens/VaultSetupScreen';
import { ReoccuranceScreen } from '../screens/ReoccuranceScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { BudgetHomeScreen } from '../screens/budget/BudgetHomeScreen';
import { AddTransactionScreen } from '../screens/budget/AddTransactionScreen';
import { AnalyticsScreen } from '../screens/budget/AnalyticsScreen';
import { TransactionsScreen } from '../screens/budget/TransactionsScreen';
import { BudgetsScreen } from '../screens/budget/BudgetsScreen';
import { WalletsScreen } from '../screens/budget/WalletsScreen';
import { DebtScreen } from '../screens/budget/DebtScreen';
import { RecurringScreen } from '../screens/budget/RecurringScreen';
import { CategoriesScreen } from '../screens/budget/CategoriesScreen';
import { getVaultUri } from '../utils/vaultSystem';
import { theme } from '../theme';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const checkVault = async () => {
      const uri = await getVaultUri();
      setInitialRoute(uri ? 'Dashboard' : 'VaultSetup');
    };
    checkVault();
  }, []);

  // Show splash until both vault check AND splash animation are done
  if (!initialRoute || !splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
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
        {/* Core */}
        <Stack.Screen name="VaultSetup" component={VaultSetupScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="NoteEditor" component={NoteEditorScreen} />
        <Stack.Screen name="Habits" component={HabitsScreen} />
        <Stack.Screen name="HabitDetail" component={HabitDetailScreen} />
        <Stack.Screen name="Reoccurance" component={ReoccuranceScreen} />

        {/* Budget */}
        <Stack.Screen name="BudgetHome" component={BudgetHomeScreen} />
        <Stack.Screen name="AddTransactionScreen" component={AddTransactionScreen} />
        <Stack.Screen name="AnalyticsScreen" component={AnalyticsScreen} />
        <Stack.Screen name="TransactionsScreen" component={TransactionsScreen} />
        <Stack.Screen name="BudgetsScreen" component={BudgetsScreen} />
        <Stack.Screen name="WalletsScreen" component={WalletsScreen} />
        <Stack.Screen name="DebtScreen" component={DebtScreen} />
        <Stack.Screen name="RecurringScreen" component={RecurringScreen} />
        <Stack.Screen name="CategoriesScreen" component={CategoriesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
