import { create } from 'zustand';
import * as React from 'react';
import { 
  type ElevationProfile, 
  type ChartDataPoint,
  loadRouteProfile,
  getElevationAtDistance,
  formatForChartJS,
  getElevationDataset
} from '../utils/gpx-parser';
import { 
  EXPECTED_TOTAL_DISTANCE,
  pageXToDistance,
  distanceToPageX,
  distanceToIndex,
  indexToDistance
} from '../constants/course';

interface ElevationStoreState {
  // Static data (loaded once)
  elevationProfile: ElevationProfile | null;
  isLoading: boolean;
  error: string | null;
  
  // Validation flag
  isDistanceValidated: boolean;
  actualTotalDistance: number;
}

interface ElevationStoreActions {
  // Data loading
  loadElevationData: () => Promise<void>;
  
  // Pure utility functions (no state changes)
  getElevationAtDistance: (distance: number) => number;
  getElevationAtIndex: (index: number) => number;
  getElevationAtPageX: (pageX: number) => number;
  
  // Chart utilities
  getChartData: () => ChartDataPoint[];
  getChartDataset: (options?: {
    fillColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }) => any;
  
  // Distance conversion utilities
  pageXToDistance: (pageX: number) => number;
  distanceToPageX: (distance: number) => number;
  distanceToIndex: (distance: number) => number;
  indexToDistance: (index: number) => number;
  
  // Validation
  validateDistanceConstants: () => void;
}

type ElevationStore = ElevationStoreState & ElevationStoreActions;

export const useElevationStore = create<ElevationStore>((set, get) => ({
  // Initial state
  elevationProfile: null,
  isLoading: false,
  error: null,
  isDistanceValidated: false,
  actualTotalDistance: 0,

  // Load elevation data from GPX
  loadElevationData: async () => {
    const state = get();
    if (state.elevationProfile || state.isLoading) {
      return; // Already loaded or loading
    }

    set({ isLoading: true, error: null });
    
    try {
      const profile = await loadRouteProfile();
      set({ 
        elevationProfile: profile, 
        isLoading: false,
        actualTotalDistance: profile.totalDistance
      });
      
      // Validate distance constants after loading
      get().validateDistanceConstants();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load elevation data',
        isLoading: false 
      });
    }
  },

  // Pure utility functions (no subscriptions triggered)
  getElevationAtDistance: (distance: number) => {
    const { elevationProfile } = get();
    if (!elevationProfile) return 0;
    return getElevationAtDistance(elevationProfile, distance);
  },

  getElevationAtIndex: (index: number) => {
    const { elevationProfile } = get();
    if (!elevationProfile || index < 0 || index >= elevationProfile.points.length) {
      return 0;
    }
    return elevationProfile.points[index].elevation;
  },

  getElevationAtPageX: (pageX: number) => {
    const distance = get().pageXToDistance(pageX);
    return get().getElevationAtDistance(distance);
  },

  // Chart utilities
  getChartData: () => {
    const { elevationProfile } = get();
    if (!elevationProfile) return [];
    return formatForChartJS(elevationProfile);
  },

  getChartDataset: (options = {}) => {
    const { elevationProfile } = get();
    if (!elevationProfile) return null;
    return getElevationDataset(elevationProfile, options);
  },

  // Distance conversion utilities
  pageXToDistance: (pageX: number) => {
    const { actualTotalDistance } = get();
    // Use actual distance if available, otherwise fall back to expected
    const totalDistance = actualTotalDistance || EXPECTED_TOTAL_DISTANCE;
    return pageXToDistance(pageX) * (totalDistance / EXPECTED_TOTAL_DISTANCE);
  },

  distanceToPageX: (distance: number) => {
    const { actualTotalDistance } = get();
    const totalDistance = actualTotalDistance || EXPECTED_TOTAL_DISTANCE;
    return distanceToPageX(distance * (EXPECTED_TOTAL_DISTANCE / totalDistance));
  },

  distanceToIndex: (distance: number) => {
    const { elevationProfile } = get();
    if (!elevationProfile) return 0;
    return distanceToIndex(distance, elevationProfile.points.length, elevationProfile.totalDistance);
  },

  indexToDistance: (index: number) => {
    const { elevationProfile } = get();
    if (!elevationProfile) return 0;
    return indexToDistance(index, elevationProfile.points.length, elevationProfile.totalDistance);
  },

  // Validate that our expected constants match actual GPX data
  validateDistanceConstants: () => {
    const { elevationProfile, actualTotalDistance, isDistanceValidated } = get();
    
    if (!elevationProfile || isDistanceValidated) return;

    const distanceDifference = Math.abs(actualTotalDistance - EXPECTED_TOTAL_DISTANCE);
    const tolerancePercent = 0.05; // 5% tolerance
    const tolerance = EXPECTED_TOTAL_DISTANCE * tolerancePercent;

    if (distanceDifference > tolerance) {
      console.warn(
        `Course distance mismatch detected:`,
        `\n  Expected: ${EXPECTED_TOTAL_DISTANCE} miles`,
        `\n  Actual GPX: ${actualTotalDistance.toFixed(2)} miles`,
        `\n  Difference: ${distanceDifference.toFixed(2)} miles (${((distanceDifference / EXPECTED_TOTAL_DISTANCE) * 100).toFixed(1)}%)`
      );
    } else {
      console.log(
        `Course distance validation passed:`,
        `\n  Expected: ${EXPECTED_TOTAL_DISTANCE} miles`,
        `\n  Actual GPX: ${actualTotalDistance.toFixed(2)} miles`
      );
    }

    set({ isDistanceValidated: true });
  }
}));

// Helper hook for components that only need the elevation data
export const useElevationData = () => {
  const store = useElevationStore();
  
  // Load data on first access
  React.useEffect(() => {
    if (!store.elevationProfile && !store.isLoading) {
      store.loadElevationData();
    }
  }, [store.elevationProfile, store.isLoading, store.loadElevationData]);

  return {
    elevationProfile: store.elevationProfile,
    isLoading: store.isLoading,
    error: store.error
  };
};

// Export individual utilities for components that need them
export const elevationUtils = {
  getElevationAtDistance: (distance: number) => useElevationStore.getState().getElevationAtDistance(distance),
  getElevationAtIndex: (index: number) => useElevationStore.getState().getElevationAtIndex(index),
  getElevationAtPageX: (pageX: number) => useElevationStore.getState().getElevationAtPageX(pageX),
  pageXToDistance: (pageX: number) => useElevationStore.getState().pageXToDistance(pageX),
  distanceToPageX: (distance: number) => useElevationStore.getState().distanceToPageX(distance),
  distanceToIndex: (distance: number) => useElevationStore.getState().distanceToIndex(distance),
  indexToDistance: (index: number) => useElevationStore.getState().indexToDistance(index),
};