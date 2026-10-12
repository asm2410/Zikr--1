import { useCallback, useRef, useState } from 'react';
import { Share, Alert } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import type { View } from 'react-native';
import type { Zikr } from '../../core/types';
import { logger } from '../../core/utils/logger';

function createSafeMediaLibrary() {
  try {
    const MediaLibrary = require('expo-media-library');
    return {
      requestPermissionsAsync: (writeOnly?: boolean) => MediaLibrary.requestPermissionsAsync(writeOnly).catch(() => ({ status: 'denied' })),
      createAssetAsync: (uri: string) => MediaLibrary.createAssetAsync(uri).catch(() => null),
      getAlbumAsync: (name: string) => MediaLibrary.getAlbumAsync(name).catch(() => null),
      addAssetsToAlbumAsync: (assets: any[], album: any, copy: boolean) => MediaLibrary.addAssetsToAlbumAsync(assets, album, copy).catch(() => {}),
      createAlbumAsync: (name: string, asset: any, copy: boolean) => MediaLibrary.createAlbumAsync(name, asset, copy).catch(() => null),
    };
  } catch {
    return null;
  }
}

const safeMediaLibrary = createSafeMediaLibrary();

export async function captureZikrCard(ref: React.RefObject<View | null>): Promise<string | null> {
  try {
    if (!ref.current) return null;
    const uri = await captureRef(ref, {
      format: 'png',
      quality: 1,
      height: 1920,
      width: 1080,
    });
    return uri;
  } catch (error) {
    logger.error('Capture failed', error);
    return null;
  }
}

export async function captureAndShareRef(ref: React.RefObject<View | null>, zikr: Zikr): Promise<boolean> {
  try {
    const uri = await captureZikrCard(ref);
    if (!uri) return false;
    return await shareZikrImage(uri, zikr);
  } catch {
    return false;
  }
}

export async function saveZikrToGallery(imageUri: string): Promise<boolean> {
  if (safeMediaLibrary) {
    try {
      const { status } = await safeMediaLibrary.requestPermissionsAsync(true);
      if (status === 'granted') {
        const asset = await safeMediaLibrary.createAssetAsync(imageUri);
        if (asset) {
          try {
            const album = await safeMediaLibrary.getAlbumAsync('Zikr');
            if (album) {
              await safeMediaLibrary.addAssetsToAlbumAsync([asset], album, false);
            } else {
              await safeMediaLibrary.createAlbumAsync('Zikr', asset, false);
            }
          } catch (albumError) {
            logger.error('Failed to add asset to Zikr album', albumError);
          }
          return true;
        }
      }
    } catch (error) {
      logger.error('Save to gallery via MediaLibrary failed, falling back to share', error);
    }
  }

  // Fallback: use expo-sharing so user can save/share on Expo Go or any device
  try {
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(imageUri, {
        mimeType: 'image/png',
        dialogTitle: 'حفظ أو مشاركة الصورة',
        UTI: 'public.png',
      });
      return true;
    }
  } catch (shareError) {
    logger.error('Fallback save/share failed', shareError);
  }

  Alert.alert('خطأ', 'تعذر حفظ أو مشاركة الصورة على هذا الجهاز');
  return false;
}

export async function shareZikrImage(imageUri: string, zikr: Zikr): Promise<boolean> {
  try {
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert('خطأ', 'المشاركة غير متاحة على هذا الجهاز');
      return false;
    }
    await Sharing.shareAsync(imageUri, {
      mimeType: 'image/png',
      dialogTitle: `مشاركة الذكر: ${zikr.arabic.slice(0, 30)}...`,
      UTI: 'public.png',
    });
    return true;
  } catch (error) {
    logger.error('Share image failed', error);
    return false;
  }
}

export async function shareZikrText(zikr: Zikr): Promise<boolean> {
  try {
    const parts: string[] = ['🕌 الذكر:', zikr.arabic, ''];
    if (zikr.transliteration) parts.push(`النطق: ${zikr.transliteration}`, '');
    if (zikr.translation) parts.push(`الترجمة: ${zikr.translation}`, '');
    if (zikr.fadl) parts.push(`✨ الفضل: ${zikr.fadl}`, '');
    parts.push('ذِكْر');

    await Share.share({ message: parts.join('\n'), title: 'مشاركة الذكر' });
    return true;
  } catch (error) {
    logger.error('Share text failed', error);
    return false;
  }
}

export interface UseZikrExportOptions {
  zikr: Zikr;
  count: number;
  accentColor: string;
  isDarkMode: boolean;
}

export function useZikrExport({ zikr, count, accentColor, isDarkMode }: UseZikrExportOptions) {
  const cardRef = useRef<View>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportAsImage = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const imageUri = await captureZikrCard(cardRef);
      if (!imageUri) throw new Error('فشل التقاط الصورة');
      const shared = await shareZikrImage(imageUri, zikr);
      if (!shared) throw new Error('فشلت المشاركة');
      return true;
    } catch (err) {
      logger.error('Export as image failed', err);
      setError('حدث خطأ أثناء المشاركة');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [zikr]);

  const saveToGallery = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const imageUri = await captureZikrCard(cardRef);
      if (!imageUri) throw new Error('فشل التقاط الصورة');
      const saved = await saveZikrToGallery(imageUri);
      if (!saved) throw new Error('فشل الحفظ');
      return true;
    } catch (err) {
      logger.error('Save to gallery failed', err);
      setError('حدث خطأ أثناء الحفظ');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const shareAsText = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const shared = await shareZikrText(zikr);
      if (!shared) throw new Error('فشلت المشاركة');
      return true;
    } catch (err) {
      logger.error('Share as text failed', err);
      setError('حدث خطأ أثناء المشاركة');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [zikr]);

  return { cardRef, isLoading, error, exportAsImage, saveToGallery, shareAsText };
}
