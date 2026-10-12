import React from 'react';
import Reanimated from 'react-native-reanimated';
import { router } from 'expo-router';
import { WidgetSettingsScreen } from '../src/features/widgets/settings/WidgetSettingsScreen';

export default function WidgetSettingsPage() {
  return (
    <Reanimated.View sharedTransitionTag="screen.root" style={{ flex: 1 }}>
      <WidgetSettingsScreen onClose={() => router.back()} />
    </Reanimated.View>
  );
}
