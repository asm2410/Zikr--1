# PROJECT MAP: تطبيق الأذكار (Azkar App)

> آخر تحديث: 2026-07-09
> المنصة: React Native / Expo SDK 56
> الإصدار المستهدف: RN 0.85.3 | React 19.2 | TypeScript 6.0.3

---

## TECH_STACK

| الطبقة | التقنية | الإصدار |
|--------|---------|---------|
| Framework | Expo (managed workflow) | SDK 56.0.11 |
| UI Engine | React Native | 0.85.3 |
| Language | TypeScript | 6.0.3 |
| Navigation | expo-router (file-based routing) | 56.2.8 |
| Animations | react-native-reanimated | 4.3.1 |
| Gestures | react-native-gesture-handler | 2.31.1 |
| Database | expo-sqlite | 56.0.4 |
| Persistence | @react-native-async-storage/async-storage | 2.2.0 |
| Icons | lucide-react-native | 1.17.0 |
| Fonts | Cairo (Google Fonts), MadinetAlBat, BIXIE (custom) | — |
| Notification | expo-notifications | 56.0.15 |
| Location | expo-location + ip-api.com | 56.0.15 |
| Prayer Times | adhan (CalculationMethod.Egyptian) | 4.4.3 |
| Share/Export | react-native-view-shot + expo-sharing | — |
| State | React Context + useReducer (4 granular contexts) | — |
| Widgets | expo-widgets + react-native-android-widget | 56.0.17 / 0.20.3 |
| Quick Actions | expo-quick-actions | 6.0.2 |
| Audio | expo-audio | 56.0.11 |
| Haptics | expo-haptics | 56.0.3 |
| SVG | react-native-svg | 15.15.4 |
| Lists | @shopify/flash-list | 2.0.2 |
| Gradients | expo-linear-gradient | 56.0.4 |

---

## ROUTES (expo-router)

| المسار | الملف | الوظيفة |
|--------|-------|---------|
| `/` | `app/index.tsx` (1040 lines) | الشاشة الرئيسية: ZikrCard + عداد + GooeyMenu + درج |
| `/fihrist` | `app/fihrist.tsx` (408 lines) | فهرس الأذكار (شاشة منفصلة) |
| `/history` | `app/history.tsx` (62 lines) | السجل والإحصائيات |
| `/settings` | `app/settings.tsx` (80 lines) | الإعدادات (modal) |
| `/tasbeeh` | `app/tasbeeh.tsx` (46 lines) | المسبحة الرقمية |
| `/search` | `app/search.tsx` (51 lines) | البحث في الأذكار |
| `/widget-settings` | `app/widget-settings.tsx` (11 lines) | إعدادات الwidgets |

---

## SYSTEM_FLOW

```
تشغيل التطبيق
    │
    ▼
┌─────────────────────────────┐
│       Splash Screen         │
│  • تحميل الخطوط (Cairo,     │
│    MadinetAlBat, BIXIE)     │
│  • فتح SQLite + seed data   │
│  • استعادة الحالة من        │
│    AsyncStorage             │
└──────────┬──────────────────┘
           ▼
┌─────────────────────────────┐
│     Main Screen (/)         │
│  ┌───────────────────────┐  │
│  │ Header: تاريخ هجري    │  │
│  │         + StatusCard   │  │
│  ├───────────────────────┤  │
│  │ ZikrCard              │  │
│  │ • النص العربي (كبير)   │  │
│  │ • ترجمة/ترانسليتريشن  │  │
│  │ • tap → عداد + Haptic │  │
│  │ • long-press → فضل    │  │
│  ├───────────────────────┤  │
│  │ CounterProgress       │  │
│  │ (دايرة SVG - Reanimated) │
│  ├───────────────────────┤  │
│  │ [Prev] [Save] [Next]  │  │
│  │ [Share] [Completion]  │  │
│  └───────────────────────┘  │
│                             │
│  قائمة عائمة (GooeyMenu)    │
│  → فهرس / محفوظات / بحث    │
│    / مسبحة / إعدادات        │
└─────────────────────────────┘
           │
    ┌──────┴──────────┬──────────┬───────────┐
    ▼                 ▼          ▼           ▼
┌────────┐      ┌────────┐  ┌────────┐  ┌──────────┐
│ Fihrist│      │ Search │  │History │  │ Tasbeeh  │
│ • جميع │      │ • بحث  │  │ • سجل  │  │ • عداد  │
│  الأقسام│      │  نصي   │  │  القراءة│  │  رقمي   │
│ • بحث  │      │ • فلتر │  │ • إحصائيات│  │ • أصوات │
│ • حفظ |      │  تصنيف │  │ • Streak│  │ • تسبيح │
│ • سجل  │      └────────┘  └────────┘  └──────────┘
│ • مسبحة│
│ • مخصصة│
│ • مطلقة│
└────────┘
```

### Data Flow

```
azkar.json ──► expo-sqlite ──► ZikrProvider (useReducer)
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
   AsyncStorage          In-memory state
   (progress, saved,    (4 granular contexts:
    settings, read,       CurrentZikrContext,
    xp, streak)           CounterContext,
                          SavedContext,
                          DispatchContext)

User actions ──► dispatch ──► useReducer ──► new state
                                        │
                                        ▼
                                  AsyncStorage sync
                                  (500ms debounce)
```

---

## DIRECTORY STRUCTURE

```
zikr-app/
├── app/                           # Expo Router pages (file-based routing)
│   ├── _layout.tsx                # Root layout: Stack + splash + DB init
│   ├── index.tsx                  # ★ Main screen (1040 lines) — ZikrCard, counter, GooeyMenu, drawer
│   ├── fihrist.tsx                # Index screen — shortcut cards + category grid
│   ├── history.tsx                # History & stats (wrapper)
│   ├── settings.tsx               # Settings (modal, wrapper)
│   ├── tasbeeh.tsx                # Digital tasbeeh (wrapper)
│   ├── search.tsx                 # Search screen (wrapper)
│   └── widget-settings.tsx        # Widget configuration screen
│
├── src/
│   ├── components/                # Shared UI components
│   │   ├── SplashLoader.tsx       # Animated splash screen (71 lines)
│   │   ├── SwipeableSheet.tsx     # Swipeable bottom sheet (123 lines)
│   │   ├── CyclePlaceholder.tsx   # Placeholder for cycle views (63 lines)
│   │   ├── NavIcons.tsx           # Navigation icon helpers (33 lines)
│   │   ├── PressCard.tsx          # Animated press card wrapper (24 lines)
│   │   └── SearchIcon.tsx         # Search icon component (23 lines)
│   │
│   ├── core/                      # Shared types, constants, utilities
│   │   ├── types.ts               # All TS interfaces (Zikr, AzkarCategory, etc.)
│   │   ├── constants.ts           # Storage keys, category IDs, DB_NAME
│   │   ├── types/
│   │   │   └── reanimated.d.ts    # Reanimated type declarations
│   │   └── utils/
│   │       ├── arabic.ts          # Arabic normalization for search
│   │       ├── hijri.ts           # Hijri date calculations (JDN algorithm)
│   │       ├── time.ts            # Time-of-day detection (adhan-based)
│   │       ├── prayerTimes.ts     # Adhan prayer times (Egyptian method)
│   │       ├── location.ts        # GPS/IP location with Cairo fallback
│   │       ├── sound.ts           # Sound playback utility
│   │       └── logger.ts          # Non-blocking async logger
│   │
│   ├── database/                  # SQLite data layer
│   │   ├── database.ts            # DB open, seed, queries (78 lines)
│   │   ├── schema.ts              # CREATE TABLE definitions (32 lines)
│   │   ├── seed.ts                # azkar.json → INSERT SQL (26 lines)
│   │   └── repositories/          # (مجلد فارغ — مخطط لطبقة DAL)
│   │
│   ├── features/                  # Domain-driven modules
│   │   ├── zikr/                  # Core zikr reading & counter
│   │   │   ├── ZikrCard.tsx       # Zikr display card (295 lines)
│   │   │   ├── CounterProgress.tsx# SVG circle + Reanimated (83 lines)
│   │   │   ├── FadlModal.tsx      # Virtue/merit modal (78 lines)
│   │   │   ├── CompletionCheckbox.tsx # Completion checkbox (82 lines)
│   │   │   └── types.ts           # Zikr-specific types (36 lines)
│   │   │
│   │   ├── drawer/                # Drawer & index components
│   │   │   ├── DrawerLayout.tsx   # Side drawer layout (428 lines)
│   │   │   ├── CategoryList.tsx   # Category grid (105 lines)
│   │   │   ├── ZikrListItem.tsx   # Zikr list item (71 lines)
│   │   │   ├── SearchBar.tsx      # Search bar (40 lines)
│   │   │   └── components/
│   │   │       └── GooeyMenu.tsx  # Floating action menu (238 lines)
│   │   │
│   │   ├── search/                # Search functionality
│   │   │   ├── SearchScreen.tsx   # Full search screen (242 lines)
│   │   │   └── SearchContext.tsx  # Search state context (20 lines)
│   │   │
│   │   ├── settings/              # Settings UI
│   │   │   ├── SettingsScreen.tsx # Full settings (258 lines)
│   │   │   └── components/
│   │   │       └── SettingsIcons.tsx # Settings icon row (132 lines)
│   │   │
│   │   ├── tasbeeh/               # Digital tasbeeh
│   │   │   └── TasbeehScreen.tsx  # ★ Largest feature file (590 lines)
│   │   │
│   │   ├── history/               # History & stats
│   │   │   └── HistoryScreen.tsx  # History display (109 lines)
│   │   │
│   │   ├── home/                  # Home screen components
│   │   │   ├── StatusCard.tsx     # XP + Streak card (233 lines)
│   │   │   ├── BestPracticeModal.tsx # Best practice modal (69 lines)
│   │   │   └── PeriodModal.tsx    # Time period modal (64 lines)
│   │   │
│   │   ├── export/                # Image export & sharing
│   │   │   ├── ZikrShareView.tsx  # Share view layout (253 lines)
│   │   │   ├── ShareSheet.tsx     # Share action sheet (94 lines)
│   │   │   └── useExport.ts       # Export hook (164 lines)
│   │   │
│   │   ├── notifications/         # Push & local notifications
│   │   │   ├── useNotifications.ts     # Schedule/cancel notifications (116 lines)
│   │   │   └── bestPracticeNotifications.ts # Best practice reminders (126 lines)
│   │   │
│   │   ├── widgets/               # Home screen widgets (multi-platform)
│   │   │   ├── useWidgetUpdater.ts     # Widget update hook (62 lines)
│   │   │   ├── platformUpdater.android.tsx # Android widget updater (56 lines)
│   │   │   ├── platformUpdater.ios.ts   # iOS widget updater (30 lines)
│   │   │   ├── android/
│   │   │   │   ├── BestPracticeWidget.tsx  (49 lines)
│   │   │   │   ├── DailyDhikrWidget.tsx    (36 lines)
│   │   │   │   ├── ProgressWidget.tsx      (79 lines)
│   │   │   │   ├── TasbeehWidget.tsx        (49 lines)
│   │   │   │   └── widgetTaskHandlers.tsx   (34 lines)
│   │   │   ├── ios/
│   │   │   │   ├── BestPracticeWidget.tsx   (36 lines)
│   │   │   │   ├── DailyDhikrWidget.tsx     (41 lines)
│   │   │   │   ├── ProgressWidget.tsx       (44 lines)
│   │   │   │   └── TasbeehWidget.tsx         (39 lines)
│   │   │   ├── data/
│   │   │   │   ├── widgetDataBridge.ts (144 lines)
│   │   │   │   ├── widgetSettings.ts   (34 lines)
│   │   │   │   └── widgetTypes.ts      (60 lines)
│   │   │   └── settings/
│   │   │       └── WidgetSettingsScreen.tsx (137 lines)
│   │   │
│   │   └── quick-actions/         # Home screen quick actions
│   │       └── setup.ts           # Quick action setup (52 lines)
│   │
│   ├── i18n/                      # Internationalization
│   │   ├── types.ts               # UiStrings interface (98 lines, 76 keys)
│   │   ├── index.ts               # i18n setup (25 lines)
│   │   ├── ar.ts                  # Arabic strings (98 lines)
│   │   └── en.ts                  # English strings (98 lines)
│   │
│   └── providers/                 # React Context providers
│       ├── AppProvider.tsx        # Root provider — composes all (21 lines)
│       ├── ThemeProvider.tsx      # Light/dark/system + adaptive colors (42 lines)
│       ├── LanguageProvider.tsx   # Arabic/English with t() (31 lines)
│       ├── ZikrProvider.tsx       # 4 granular contexts (173 lines)
│       └── HapticProvider.tsx     # Haptic feedback context (43 lines)
│
├── assets/                        # Static assets
│   ├── fonts/
│   │   ├── (Cairo via Google Fonts)
│   │   ├── alfont_com_BIXIE-Regular.ttf     (109.6 KB)
│   │   └── alfont_com_MadinetAlBatv4.ttf    (49 KB)
│   ├── icons/
│   │   ├── icon.png                         (21.3 KB)
│   │   ├── splash-icon.png                  (21.3 KB)
│   │   ├── favicon.png                      (2.3 KB)
│   │   ├── android-icon-background.png      (6.4 KB)
│   │   ├── android-icon-foreground.png      (18.2 KB)
│   │   ├── android-icon-monochrome.png      (18.2 KB)
│   │   ├── shortcut-saved.png               (5.2 KB)
│   │   ├── shortcut-search.png              (5.2 KB)
│   │   └── shortcut-tasbeeh.png             (5.2 KB)
│   ├── sounds/
│   │   ├── tap.wav                          (0.8 KB)
│   │   ├── counter.mp3                      (1.2 KB)
│   │   ├── complete.wav                     (1.1 KB)
│   │   ├── menu.mp3                         (0.9 KB)
│   │   ├── save_zikr.mp3                    (1.3 KB)
│   │   ├── Achieve_the_zikr.mp3             (2.1 KB)
│   │   ├── notification-morning.wav         (0.9 KB)
│   │   ├── notification-evening.wav         (0.9 KB)
│   │   └── notification-sleep.wav           (0.9 KB)
│   └── data/
│       ├── azkar.json                       (489.5 KB, 7084 lines, 297 entries)
│       ├── azkar.json.bak                   (451.2 KB)
│       └── azkar.json.bak2                  (485.8 KB)
│
├── android/                       # Native Android project
│   ├── app/
│   │   ├── build.gradle
│   │   ├── proguard-rules.pro
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       ├── java/com/zikr/app/
│   │       │   ├── MainActivity.kt
│   │       │   ├── MainApplication.kt
│   │       │   └── widget/
│   │       │       ├── BestPracticeWidget.java
│   │       │       ├── DailyDhikrWidget.java
│   │       │       ├── ProgressWidget.java
│   │       │       └── TasbeehWidget.java
│   │       └── res/
│   │           ├── drawable/ (widget previews + splash + icons)
│   │           ├── mipmap-*/ (launcher icons, shortcut icons)
│   │           ├── values/ (colors.xml, strings.xml, styles.xml)
│   │           └── xml/ (widget provider configs)
│   ├── build.gradle
│   ├── gradle.properties
│   ├── settings.gradle
│   └── gradle/wrapper/
│
├── .opencode/
│   └── skills/azkar-app/SKILL.md  # AI agent skill reference
│
├── app.json                       # Expo configuration (159 lines)
├── package.json                   # Dependencies (31 packages, 54 lines)
├── tsconfig.json                  # TypeScript config (11 lines)
├── babel.config.js                # Expo preset + Reanimated plugin (7 lines)
├── eslint.config.js               # Expo flat config (12 lines)
├── .prettierrc                    # Code formatting rules (8 lines)
├── eas.json                       # EAS Build config (31 lines)
├── index.ts                      # Entry: import 'expo-router/entry' (1 line)
├── LICENSE                       # MIT license
├── AGENTS.md                     # AI agent instructions
└── CLAUDE.md                     # Points to AGENTS.md
```

---

## PROVIDER HIERARCHY

```
AppProvider
  ├── ThemeProvider      → useTheme() → { theme, themeMode, setThemeMode }
  ├── LanguageProvider   → useLanguage() → { language, setLanguage, t }
  ├── HapticProvider     → useHaptics() → { triggerHaptic }
  ├── ZikrProvider       → 4 granular contexts:
  │     ├── CurrentZikrContext  → useCurrentZikr()
  │     ├── CounterContext      → useZikrCounter()
  │     ├── SavedContext        → useZikrSaved()
  │     └── DispatchContext     → useZikrDispatch()
  └── SearchProvider     → useSearchContext() → { searchQuery, setSearchQuery }
```

### ZikrProvider State

```typescript
interface ZikrState {
  currentZikr: Zikr | null;
  progress: Record<string, number>;    // arabicText → count
  savedAzkar: Zikr[];
  countRecords: CountRecord[];
  count: number;                        // current session
  history: Zikr[];                      // last 100
}
// Actions: SET_CURRENT_ZIKR | INCREMENT_COUNT | SET_PROGRESS
//          SAVE_ZIKR | REMOVE_SAVED | ADD_RECORD
//          SET_COUNT | ADD_HISTORY | LOAD_STATE
```

### Performance Optimizations (June 2026)
- **4 granular contexts** вместо monolithic — كل context يتغير بشكل مستقل
- **500ms debounce** على AsyncStorage writes
- **Reanimated** بدل RN Animated للـ CounterProgress (UI thread)
- **useMemo** لألوان الثيم (getAdaptiveTheme)
- **React.memo** للـ DrawerLayout
- **useRef** لحفظ saved values في fihrist لتجنب re-renders

---

## KEY COMPONENTS

### ZikrCard (`src/features/zikr/ZikrCard.tsx`)
- عرض النص العربي مع استخراج البسملة والاستعاذة
- تحجيم ديناميكي للخط حسب طول النص
- عرض الترجمة والترانسليتريشن حسب اللغة
- أزرار حفظ/مشاركة/التنقل بين الأذكار
- أنيميشن انزلاق بين الأذكار

### CounterProgress (`src/features/zikr/CounterProgress.tsx`)
- دائرة SVG بتقدم متحرك (Reanimated, UI thread)
- عرض العداد الحالي في المنتصف
- نبض عند الوصول للنصف

### DrawerLayout (`src/features/drawer/DrawerLayout.tsx`)
- درج جانبي (يسار) في الشاشة الرئيسية
- يعرض المحفوظات، الأذكار المطلقة، المخصصة
- قائمة التصنيفات مع البحث
- React.memo + stable keyExtractor

### GooeyMenu (`src/features/drawer/components/GooeyMenu.tsx`)
- زر عائم (FAB) في أعلى اليسار
- expands to: فهرس، محفوظات، بحث، مسبحة، إعدادات
- React Native Reanimated spring animations

### CategoryList (`src/features/drawer/CategoryList.tsx`)
- شبكة تصنيفات (2 أعمدة) مع عدد الأذكار
- بطاقات مضغوطة مع border و animated press

### ZikrListItem (`src/features/drawer/ZikrListItem.tsx`)
- عنصر ذكر في القوائم (فهرس، بحث، محفوظات)
- عرض النص العربي (Bold) + الترجمة + badge العدد

### FihristScreen (`app/fihrist.tsx`)
- شاشة منفصلة للفهرس
- Shortcut cards: محفوظات، سجل، مسبحة، مخصصة، مطلقة
- قائمة جميع التصنيفات + بحث

### TasbeehScreen (`src/features/tasbeeh/TasbeehScreen.tsx`)
- مسبحة رقمية كاملة (أكبر ملف feature: 590 lines)
- عداد + أصوات + إحصائيات

### StatusCard (`src/features/home/StatusCard.tsx`)
- XP points + Streck (عدد الأيام المتتالية)
- يظهر في Header الشاشة الرئيسية

### SplashLoader (`src/components/SplashLoader.tsx`)
- شاشة تحميل متحركة (4 ثواني minimum)
- تحميل الخطوط + فتح SQLite + seed + استعادة AsyncStorage

---

## DATABASE SCHEMA

```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  orderIndex INTEGER NOT NULL
);

CREATE TABLE adhkar (
  id INTEGER PRIMARY KEY,
  categoryId INTEGER NOT NULL,
  title TEXT,
  titleAr TEXT,
  arabicText TEXT NOT NULL,
  transliteration TEXT,
  translation TEXT NOT NULL,
  repeatCount INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  sourceReference TEXT,
  fadl TEXT,
  sourceReferenceEn TEXT,
  fadlEn TEXT,
  orderIndex INTEGER NOT NULL,
  tags TEXT DEFAULT '[]',
  FOREIGN KEY (categoryId) REFERENCES categories(id)
);
```

---

## i18n SYSTEM

- **76 keys** in كل لغة (ar.ts / en.ts)
- الاستخدام: `const { t } = useLanguage();` ← `t.settings`, `t.morningAzkar`
- `getCategoryLabel(title, subtitle, language)` ← returns appropriate label
- كل النصوص المعروضة للمستخدم تذهب عبر i18n

---

## WIDGET SYSTEM

4 أنواع من الـ Widgets (Android + iOS):
| النوع | الوظيفة |
|-------|---------|
| **DailyDhikrWidget** | عرض ذكر اليوم |
| **TasbeehWidget** | مسبحة سريعة من الشاشة الرئيسية |
| **ProgressWidget** | عرض تقدم الأذكار اليومية |
| **BestPracticeWidget** | تذكير بأفضل الممارسات |

---

## azkar.json STATUS (297 entries)

| الحقل | الحالة |
|-------|--------|
| sourceReference | ✅ مكتمل (297/297) — Hisn Muslim |
| sourceReferenceEn | ✅ مكتمل (297/297) — Hisn Muslim |
| fadl | ✅ مكتمل (297/297) — من الأحاديث الصحيحة |
| fadlEn | ✅ مكتمل (297/297) — من الأحاديث الصحيحة |
| التصنيفات | 30+ (Morning=1, Evening=2, Absolute=134, Custom=135, ...) |
| seedVersion | 15 |

---

## EXPORT SYSTEM

- **useZikrExport()** — hook يوفر 3 وظائف:
  - `exportAsImage()` — تصدير كصورة (react-native-view-shot)
  - `saveToGallery()` — حفظ في المعرض (expo-media-library)
  - `shareAsText()` — مشاركة كنص (Share.share())
- **ZikrShareView** — تصميم الصورة المصدرة مع خلفية مخصصة

---

## NOTIFICATIONS

- **3 تذكيرات يومية:**
  - صباحاً 05:00
  - مساءً 15:00
  - قبل النوم 21:00
- **Best practice notifications** — تذكيرات إضافية للممارسات المستحبة
- Android channel 'azkar' بأولوية HIGH
- استخدام `createSafeNotifications()` للـ web fallback

---

## CONVENTIONS

- **All styles at bottom** of file using `StyleSheet.create({...})`
- **No comments** in code
- **AsyncStorage** uses `.catch(() => {})` for silent failures
- **Platform checks**: `Platform.OS !== 'web'` for native-only features
- **Animated press**: `onPressIn` / `onPressOut` with scale 0.96 → 1
- **Header**: iOS paddingTop 56, height ~124; Android paddingTop 12, height ~80
- **Haptic patterns**: Heavy on tap, Success at halfway + completion
- **Cards**: borderRadius 18-24, borderWidth 1.5, accent color borders
- **Z-index layers**: drawerOverlay=100, GooeyMenu=100, celebration=50, navButtons=13, card=12

---

## MILESTONES STATUS

| M | الوصف | الحالة |
|---|-------|--------|
| M1 | Foundation (Expo init, routing, SQLite, types, providers) | ✅ كامل |
| M2 | Core Zikr (ZikrCard, counter, drawer, fadl modal, navigation) | ✅ كامل |
| M3 | Enhanced (tasbeeh, notifications, export, history, streak) | ✅ كامل |
| M4 | Polish (a11y, performance, dark mode, app icon, EAS Build) | ✅ كامل |
| M5 | Widgets (Android + iOS home screen widgets, 4 types) | ✅ كامل |
| M6 | Advanced (quick actions, best practices, sound system) | ✅ كامل |

---

## CHANGELOG

| التاريخ | التعديل | الملفات المتأثرة |
|---------|---------|------------------|
| 2026-07-09 | تحديث PROJECT MAP كامل بكل الملفات المفقودة | `PROJECT_MAP.md` |
| 2026-06-04 | شاشة فهرس منفصلة (fihrist) | `app/fihrist.tsx`, `app/_layout.tsx`, `app/index.tsx` |
| 2026-06-04 | تعديل ترتيب بطاقات الفهرس | `app/fihrist.tsx` |
| 2026-06-04 | جعل خط الأذكار Bold في القوائم | `ZikrListItem.tsx` |
| 2026-06-04 | توحيد أزرار الرجوع (بحث + فهرس) | `SearchScreen.tsx` |
| 2026-06-04 | تحسين أبعاد البطاقات وإظهار العنوان كاملاً | `CategoryList.tsx`, `fihrist.tsx` |
| 2026-06-04 | تحسينات أداء (4 contexts, debounce, Reanimated) | متعدد (انظر AGENTS.md) |
