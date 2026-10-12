import React, { useEffect, useState, Component, type ReactNode } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Platform, ScrollView } from 'react-native';
import SplashLoader from '../src/components/SplashLoader';
import { useFonts } from 'expo-font';
import {
  Cairo_400Regular,
  Cairo_600SemiBold,
  Cairo_700Bold,
  Cairo_900Black,
} from '@expo-google-fonts/cairo';
import { Poppins_800ExtraBold } from '@expo-google-fonts/poppins';
import { AppProvider } from '../src/providers/AppProvider';
import { useTheme } from '../src/providers/ThemeProvider';
import { getDatabase, seedDatabase } from '../src/database/database';
import { generateSeedSQL } from '../src/database/seed';
import zikrData from '../assets/azkar.json';
import { logger } from '../src/core/utils/logger';
import type { ZikrData } from '../src/core/types';

let globalErrorState: { error: string; stack: string } | null = null;
let globalErrorListener: ((err: { error: string; stack: string }) => void) | null = null;

if (typeof ErrorUtils !== 'undefined') {
  const defaultHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
    const errObj = {
      error: error?.message || error?.toString() || 'Unknown Fatal Error',
      stack: error?.stack || '',
    };
    globalErrorState = errObj;
    if (globalErrorListener) globalErrorListener(errObj);
    if (defaultHandler) defaultHandler(error, isFatal);
  });
}

class GlobalErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string; stack: string }> {
  constructor(props: any) {
    super(props);
    this.state = {
      hasError: !!globalErrorState,
      error: globalErrorState?.error || '',
      stack: globalErrorState?.stack || '',
    };
  }

  static getDerivedStateFromError(error: any) {
    return {
      hasError: true,
      error: error?.message || error?.toString() || 'React Boundary Error',
      stack: error?.stack || '',
    };
  }

  componentDidMount() {
    globalErrorListener = (err) => {
      this.setState({ hasError: true, error: err.error, stack: err.stack });
    };
  }

  componentWillUnmount() {
    globalErrorListener = null;
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>⚠️ خطأ في تشغيل التطبيق (Error Details)</Text>
          <ScrollView style={styles.errorBox}>
            <Text style={styles.errorText}>{this.state.error}</Text>
            {!!this.state.stack && <Text style={styles.stackText}>{this.state.stack}</Text>}
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

let hasHandledInitialQuickAction = false;

function getSafeQuickActions() {
  try {
    return require('expo-quick-actions');
  } catch { return null; }
}

function useSafeQuickActionRouting(isReady: boolean) {
  useEffect(() => {
    if (!isReady) return;
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;
    try {
      const qa = getSafeQuickActions();
      if (!qa) return;

      if (qa.setItems) {
        qa.setItems([
          {
            id: 'search',
            title: 'بحث',
            icon: Platform.OS === 'ios' ? 'symbol:magnifyingglass' : 'shortcut_search',
            params: { href: '/search' },
          },
          {
            id: 'tasbeeh',
            title: 'المسبحة',
            icon: Platform.OS === 'ios' ? 'symbol:hand.thumbsup' : 'shortcut_tasbeeh',
            params: { href: '/tasbeeh' },
          },
          {
            id: 'saved',
            title: 'المحفوظ',
            icon: Platform.OS === 'ios' ? 'symbol:heart' : 'shortcut_saved',
            params: { href: '/?saved=true' },
          },
        ]).catch(() => {});
      }

      const handleAction = (action: any) => {
        if (!action?.params?.href) return;
        setTimeout(() => {
          try {
            router.navigate(action.params.href);
          } catch (e) {
            logger.error('QuickAction navigation failed', e);
          }
        }, 100);
      };

      if (!hasHandledInitialQuickAction && qa.initial) {
        hasHandledInitialQuickAction = true;
        handleAction(qa.initial);
      }

      const subscription = qa.addListener((event: any) => {
        handleAction(event);
      });

      return () => {
        subscription?.remove?.();
      };
    } catch (e) {
      logger.error('useSafeQuickActionRouting error', e);
    }
  }, [isReady]);
}

function RootLayoutInner() {
  const { theme } = useTheme();
  const [dbReady, setDbReady] = useState(false);
  const [minSplashPassed, setMinSplashPassed] = useState(false);

  const [fontsLoaded] = useFonts({
    Cairo_400Regular,
    Cairo_600SemiBold,
    Cairo_700Bold,
    Cairo_900Black,
    Poppins_800ExtraBold,
    MadinetAlBat: require('../assets/alfont_com_MadinetAlBatv4.ttf'),
    BIXIE: require('../assets/alfont_com_BIXIE-Regular.ttf'),
  });

  const isReady = !!fontsLoaded && dbReady && minSplashPassed;
  useSafeQuickActionRouting(isReady);

  useEffect(() => {
    const timer = setTimeout(() => setMinSplashPassed(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    try {
      const { registerWidgetTaskHandler } = require('react-native-android-widget');
      const { widgetTaskHandler } = require('../src/features/widgets/android/widgetTaskHandlers');
      registerWidgetTaskHandler(widgetTaskHandler);
    } catch {}
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    function checkIsExpoGo(): boolean {
      try {
        const ConstantsModule = require('expo-constants');
        const Constants = ConstantsModule?.default ?? ConstantsModule;
        if (
          Constants?.appOwnership === 'expo' ||
          Constants?.executionEnvironment === 'storeClient' ||
          Constants?.expoConfig?.executionEnvironment === 'storeClient' ||
          Constants?.manifest?.executionEnvironment === 'storeClient'
        ) {
          return true;
        }
      } catch {
        return true;
      }
      return false;
    }

    if (checkIsExpoGo()) return;

    let safeNotifications: any;
    try {
      const Notifications = require('expo-notifications');
      if (!Notifications?.getLastNotificationResponse) return;
      safeNotifications = Notifications;
    } catch {
      return;
    }

    function redirect(notification: any) {
      const data = notification.request.content.data;
      if (data?.type === 'bestPractice') {
        router.replace('/?openBestPractice=true');
      }
    }

    (async () => {
      try {
        const response = await safeNotifications.getLastNotificationResponse?.();
        if (response?.notification) redirect(response.notification);
      } catch {}
    })();

    let subscription: any;
    try {
      subscription = safeNotifications.addNotificationResponseReceivedListener((response: any) => {
        if (response?.notification) redirect(response.notification);
      });
    } catch {}

    return () => {
      if (subscription?.remove) subscription.remove();
    };
  }, []);

  useEffect(() => {
    async function initDB() {
      try {
        const db = await getDatabase();
        const seedSQL = generateSeedSQL(zikrData as unknown as ZikrData);
        await seedDatabase(seedSQL, (zikrData as any).seedVersion ?? 0);
        logger.info('App initialized');
      } catch (err) {
        logger.error('Init failed', err);
      }
      setDbReady(true);
    }
    initDB();
  }, []);

  if (!fontsLoaded || !dbReady || !minSplashPassed) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
        <SplashLoader textColor={theme.colors.textLight} refColor={theme.colors.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 300,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="history" />
        <Stack.Screen name="tasbeeh" />
        <Stack.Screen name="fihrist" />
        <Stack.Screen name="search" options={{ animation: 'slide_from_bottom', animationDuration: 350 }} />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_bottom', animationDuration: 350, presentation: 'modal' }} />
        <Stack.Screen name="widget-settings" options={{ animation: 'slide_from_bottom', animationDuration: 350, presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GlobalErrorBoundary>
      <AppProvider>
        <RootLayoutInner />
      </AppProvider>
    </GlobalErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, backgroundColor: '#121212', padding: 20, paddingTop: 60 },
  errorTitle: { color: '#FF5252', fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  errorBox: { flex: 1, backgroundColor: '#1E1E1E', padding: 14, borderRadius: 8 },
  errorText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginBottom: 10 },
  stackText: { color: '#A0A0A0', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
});
