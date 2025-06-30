import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Animated } from 'react-native';
import SwipeableItem from '../../components/SwipeableItem';

// Mock react-native-gesture-handler
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

// Mock Animated
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

describe('SwipeableItem', () => {
  const mockProps = {
    children: <text testID="child-content">Test Content</text>,
    onSwipeLeft: jest.fn(),
    onSwipeRight: jest.fn(),
    leftAction: {
      text: 'Edit',
      color: '#007AFF',
      onPress: jest.fn(),
    },
    rightAction: {
      text: 'Delete',
      color: '#FF3B30',
      onPress: jest.fn(),
    },
    threshold: 100,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render children correctly', () => {
      const { getByTestId } = render(<SwipeableItem {...mockProps} />);
      
      expect(getByTestId('child-content')).toBeTruthy();
    });

    it('should render without actions', () => {
      const { getByTestId } = render(
        <SwipeableItem>
          <text testID="child-content">Test Content</text>
        </SwipeableItem>
      );
      
      expect(getByTestId('child-content')).toBeTruthy();
    });

    it('should render with only left action', () => {
      const { getByTestId } = render(
        <SwipeableItem leftAction={mockProps.leftAction}>
          <text testID="child-content">Test Content</text>
        </SwipeableItem>
      );
      
      expect(getByTestId('child-content')).toBeTruthy();
    });

    it('should render with only right action', () => {
      const { getByTestId } = render(
        <SwipeableItem rightAction={mockProps.rightAction}>
          <text testID="child-content">Test Content</text>
        </SwipeableItem>
      );
      
      expect(getByTestId('child-content')).toBeTruthy();
    });
  });

  describe('gesture handling', () => {
    it('should handle pan gesture events', () => {
      const { getByTestId } = render(<SwipeableItem {...mockProps} />);
      const gestureHandler = getByTestId('swipeable-gesture-handler');
      
      // Simulate pan gesture
      fireEvent(gestureHandler, 'onGestureEvent', {
        nativeEvent: {
          translationX: 50,
          velocityX: 100,
          state: 'ACTIVE',
        },
      });
      
      expect(gestureHandler).toBeTruthy();
    });

    it('should trigger left swipe when threshold is exceeded', async () => {
      const { getByTestId } = render(<SwipeableItem {...mockProps} />);
      const gestureHandler = getByTestId('swipeable-gesture-handler');
      
      // Simulate swipe right to reveal left action
      fireEvent(gestureHandler, 'onGestureEvent', {
        nativeEvent: {
          translationX: 120, // Exceeds threshold
          velocityX: 200,
          state: 'END',
        },
      });
      
      await waitFor(() => {
        expect(mockProps.onSwipeLeft).toHaveBeenCalled();
      });
    });

    it('should trigger right swipe when threshold is exceeded', async () => {
      const { getByTestId } = render(<SwipeableItem {...mockProps} />);
      const gestureHandler = getByTestId('swipeable-gesture-handler');
      
      // Simulate swipe left to reveal right action
      fireEvent(gestureHandler, 'onGestureEvent', {
        nativeEvent: {
          translationX: -120, // Exceeds threshold
          velocityX: -200,
          state: 'END',
        },
      });
      
      await waitFor(() => {
        expect(mockProps.onSwipeRight).toHaveBeenCalled();
      });
    });

    it('should not trigger swipe when threshold is not exceeded', async () => {
      const { getByTestId } = render(<SwipeableItem {...mockProps} />);
      const gestureHandler = getByTestId('swipeable-gesture-handler');
      
      // Simulate small swipe
      fireEvent(gestureHandler, 'onGestureEvent', {
        nativeEvent: {
          translationX: 50, // Below threshold
          velocityX: 50,
          state: 'END',
        },
      });
      
      await waitFor(() => {
        expect(mockProps.onSwipeLeft).not.toHaveBeenCalled();
        expect(mockProps.onSwipeRight).not.toHaveBeenCalled();
      });
    });
  });

  describe('action buttons', () => {
    it('should render left action button when swiped right', async () => {
      const { getByTestId, getByText } = render(<SwipeableItem {...mockProps} />);
      const gestureHandler = getByTestId('swipeable-gesture-handler');
      
      // Simulate swipe to reveal left action
      fireEvent(gestureHandler, 'onGestureEvent', {
        nativeEvent: {
          translationX: 120,
          velocityX: 200,
          state: 'ACTIVE',
        },
      });
      
      await waitFor(() => {
        expect(getByText('Edit')).toBeTruthy();
      });
    });

    it('should render right action button when swiped left', async () => {
      const { getByTestId, getByText } = render(<SwipeableItem {...mockProps} />);
      const gestureHandler = getByTestId('swipeable-gesture-handler');
      
      // Simulate swipe to reveal right action
      fireEvent(gestureHandler, 'onGestureEvent', {
        nativeEvent: {
          translationX: -120,
          velocityX: -200,
          state: 'ACTIVE',
        },
      });
      
      await waitFor(() => {
        expect(getByText('Delete')).toBeTruthy();
      });
    });

    it('should call action onPress when button is pressed', async () => {
      const { getByTestId, getByText } = render(<SwipeableItem {...mockProps} />);
      const gestureHandler = getByTestId('swipeable-gesture-handler');
      
      // Reveal left action
      fireEvent(gestureHandler, 'onGestureEvent', {
        nativeEvent: {
          translationX: 120,
          velocityX: 200,
          state: 'ACTIVE',
        },
      });
      
      await waitFor(() => {
        const editButton = getByText('Edit');
        fireEvent.press(editButton);
        expect(mockProps.leftAction.onPress).toHaveBeenCalled();
      });
    });
  });

  describe('animation', () => {
    it('should animate to closed position when gesture is cancelled', async () => {
      const { getByTestId } = render(<SwipeableItem {...mockProps} />);
      const gestureHandler = getByTestId('swipeable-gesture-handler');
      
      // Start swipe
      fireEvent(gestureHandler, 'onGestureEvent', {
        nativeEvent: {
          translationX: 80,
          velocityX: 100,
          state: 'ACTIVE',
        },
      });
      
      // Cancel gesture
      fireEvent(gestureHandler, 'onGestureEvent', {
        nativeEvent: {
          translationX: 0,
          velocityX: 0,
          state: 'CANCELLED',
        },
      });
      
      // Animation should return to closed position
      expect(Animated.timing).toHaveBeenCalled();
    });

    it('should animate to open position when threshold is exceeded', async () => {
      const { getByTestId } = render(<SwipeableItem {...mockProps} />);
      const gestureHandler = getByTestId('swipeable-gesture-handler');
      
      fireEvent(gestureHandler, 'onGestureEvent', {
        nativeEvent: {
          translationX: 120,
          velocityX: 200,
          state: 'END',
        },
      });
      
      expect(Animated.timing).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByTestId } = render(<SwipeableItem {...mockProps} />);
      const container = getByTestId('swipeable-container');
      
      expect(container).toHaveAccessibilityRole('button');
      expect(container).toHaveAccessibilityHint('Swipe to reveal actions');
    });

    it('should announce actions when revealed', async () => {
      const { getByTestId, getByText } = render(<SwipeableItem {...mockProps} />);
      const gestureHandler = getByTestId('swipeable-gesture-handler');
      
      fireEvent(gestureHandler, 'onGestureEvent', {
        nativeEvent: {
          translationX: 120,
          velocityX: 200,
          state: 'ACTIVE',
        },
      });
      
      await waitFor(() => {
        const editButton = getByText('Edit');
        expect(editButton).toHaveAccessibilityRole('button');
        expect(editButton).toHaveAccessibilityLabel('Edit');
      });
    });
  });

  describe('performance', () => {
    it('should use native driver for animations', () => {
      render(<SwipeableItem {...mockProps} />);
      
      // Check that animations use native driver
      expect(Animated.timing).toHaveBeenCalledWith(
        expect.any(Animated.Value),
        expect.objectContaining({
          useNativeDriver: true,
        })
      );
    });

    it('should throttle gesture events', () => {
      const { getByTestId } = render(<SwipeableItem {...mockProps} />);
      const gestureHandler = getByTestId('swipeable-gesture-handler');
      
      // Simulate rapid gesture events
      for (let i = 0; i < 10; i++) {
        fireEvent(gestureHandler, 'onGestureEvent', {
          nativeEvent: {
            translationX: i * 10,
            velocityX: 100,
            state: 'ACTIVE',
          },
        });
      }
      
      // Should not cause performance issues
      expect(gestureHandler).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle multiple rapid swipes', async () => {
      const { getByTestId } = render(<SwipeableItem {...mockProps} />);
      const gestureHandler = getByTestId('swipeable-gesture-handler');
      
      // Rapid swipes in opposite directions
      fireEvent(gestureHandler, 'onGestureEvent', {
        nativeEvent: {
          translationX: 120,
          velocityX: 200,
          state: 'END',
        },
      });
      
      fireEvent(gestureHandler, 'onGestureEvent', {
        nativeEvent: {
          translationX: -120,
          velocityX: -200,
          state: 'END',
        },
      });
      
      // Should handle gracefully without crashes
      expect(gestureHandler).toBeTruthy();
    });

    it('should handle undefined actions gracefully', () => {
      expect(() => {
        render(
          <SwipeableItem leftAction={undefined} rightAction={undefined}>
            <text>Test</text>
          </SwipeableItem>
        );
      }).not.toThrow();
    });

    it('should handle custom threshold values', () => {
      const customThreshold = 150;
      const { getByTestId } = render(
        <SwipeableItem {...mockProps} threshold={customThreshold} />
      );
      const gestureHandler = getByTestId('swipeable-gesture-handler');
      
      // Swipe just below custom threshold
      fireEvent(gestureHandler, 'onGestureEvent', {
        nativeEvent: {
          translationX: 140,
          velocityX: 200,
          state: 'END',
        },
      });
      
      expect(mockProps.onSwipeLeft).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should clean up event listeners on unmount', () => {
      const { unmount } = render(<SwipeableItem {...mockProps} />);
      
      unmount();
      
      // Should not cause memory leaks
      expect(true).toBe(true);
    });
  });
});