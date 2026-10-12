import 'react-native-reanimated';

declare module 'react-native-reanimated' {
  interface AnimatedProps {
    sharedTransitionTag?: string;
  }
}
