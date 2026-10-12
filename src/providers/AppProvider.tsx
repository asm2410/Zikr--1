import React, { type ReactNode } from 'react';
import { ThemeProvider } from './ThemeProvider';
import { LanguageProvider } from './LanguageProvider';
import { FontSizeProvider } from './FontSizeProvider';
import { ZikrProvider } from './ZikrProvider';
import { SearchProvider } from '../features/search/SearchContext';
import { HapticProvider } from './HapticProvider';

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <FontSizeProvider>
          <ZikrProvider>
            <SearchProvider>
              <HapticProvider>
                {children}
              </HapticProvider>
            </SearchProvider>
          </ZikrProvider>
        </FontSizeProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
