import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';

const counterSource = require('../../../assets/sounds/counter.mp3');
const achieveSource = require('../../../assets/sounds/Achieve_the_zikr.mp3');
const menuSource = require('../../../assets/sounds/menu.mp3');
const saveSource = require('../../../assets/sounds/save_zikr.mp3');

let expoAudioModule: any = null;
try {
  expoAudioModule = require('expo-audio');
} catch {}

function safeUseAudioPlayer(source: any) {
  try {
    if (expoAudioModule && typeof expoAudioModule.useAudioPlayer === 'function') {
      return expoAudioModule.useAudioPlayer(source);
    }
  } catch {}
  return null;
}

export function useSound() {
  const counterPlayer = safeUseAudioPlayer(counterSource);
  const achievePlayer = safeUseAudioPlayer(achieveSource);
  const menuPlayer = safeUseAudioPlayer(menuSource);
  const savePlayer = safeUseAudioPlayer(saveSource);

  useEffect(() => {
    try {
      if (expoAudioModule && typeof expoAudioModule.setAudioModeAsync === 'function') {
        expoAudioModule.setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
      }
    } catch {}
  }, []);

  const playTap = useCallback(async () => {
    if (Platform.OS === 'web' || !counterPlayer) return;
    try {
      await counterPlayer.stop?.();
      counterPlayer.play?.();
    } catch {}
  }, [counterPlayer]);

  const playComplete = useCallback(async () => {
    if (Platform.OS === 'web' || !achievePlayer) return;
    try {
      await achievePlayer.stop?.();
      achievePlayer.play?.();
    } catch {}
  }, [achievePlayer]);

  const playMenu = useCallback(async () => {
    if (Platform.OS === 'web' || !menuPlayer) return;
    try {
      await menuPlayer.stop?.();
      menuPlayer.play?.();
    } catch {}
  }, [menuPlayer]);

  const playSave = useCallback(async () => {
    if (Platform.OS === 'web' || !savePlayer) return;
    try {
      await savePlayer.stop?.();
      savePlayer.play?.();
    } catch {}
  }, [savePlayer]);

  return { playTap, playComplete, playMenu, playSave };
}
