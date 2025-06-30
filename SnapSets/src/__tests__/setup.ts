import 'react-native-gesture-handler/jestSetup';
import '@testing-library/jest-native/extend-expect';

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock Expo modules
jest.mock('expo-camera', () => ({
  Camera: 'Camera',
  CameraType: {
    back: 'back',
    front: 'front',
  },
  FlashMode: {
    on: 'on',
    off: 'off',
    auto: 'auto',
  },
}));

jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn(),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock reanimated
jest.mock('react-native-reanimated', () => {
  const mockReanimated = {
    Value: jest.fn(),
    event: jest.fn(),
    add: jest.fn(),
    eq: jest.fn(),
    set: jest.fn(),
    cond: jest.fn(),
    interpolate: jest.fn(),
    View: jest.fn(),
    Extrapolate: { EXTEND: jest.fn(), CLAMP: jest.fn(), IDENTITY: jest.fn() },
    Transition: {
      Together: 'Together',
      In: 'In',
      Out: 'Out',
    },
    Easing: {
      in: jest.fn(),
      out: jest.fn(),
      inOut: jest.fn(),
    },
    call: jest.fn(),
    Code: jest.fn(),
    function: jest.fn(),
    sub: jest.fn(),
    block: jest.fn(),
    timing: jest.fn(),
    debug: jest.fn(),
    multiply: jest.fn(),
    divide: jest.fn(),
    proc: jest.fn(),
  };
  return mockReanimated;
});

// Mock gesture handler
jest.mock('react-native-gesture-handler', () => ({
  PanGestureHandler: 'PanGestureHandler',
  State: {
    BEGAN: 'BEGAN',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED',
    ACTIVE: 'ACTIVE',
    END: 'END',
  },
}));

// Mock global fetch for API tests
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Console override for cleaner test output
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});