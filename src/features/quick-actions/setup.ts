import { useEffect } from 'react';
import { Platform } from 'react-native';

export function useQuickActions() {
  useEffect(() => {
    let mounted = true;

    async function setup() {
      try {
        const QuickActions = require('expo-quick-actions');

        if (!mounted) return;

        QuickActions.setItems([
          {
            id: 'search',
            title: 'بحث',
            subtitle: Platform.OS === 'ios' ? 'ابحث في الأذكار' : undefined,
            icon: Platform.OS === 'ios' ? 'symbol:magnifyingglass' : 'shortcut_search',
            params: { href: '/search' },
          },
          {
            id: 'tasbeeh',
            title: 'المسبحة',
            subtitle: Platform.OS === 'ios' ? 'عداد التسبيح' : undefined,
            icon: Platform.OS === 'ios' ? 'symbol:hand.thumbsup' : 'shortcut_tasbeeh',
            params: { href: '/tasbeeh' },
          },
          {
            id: 'saved',
            title: 'المحفوظ',
            subtitle: Platform.OS === 'ios' ? 'الأذكار المحفوظة' : undefined,
            icon: Platform.OS === 'ios' ? 'symbol:heart' : 'shortcut_saved',
            params: { href: '/?saved=true' },
          },
        ]);
      } catch {}
    }

    setup();

    return () => { mounted = false; };
  }, []);
}


