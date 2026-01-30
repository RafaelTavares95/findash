'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setSlots } from '@/store/slices/reservesSlice';

export function DataPersistence() {
  const dispatch = useDispatch();
  const slots = useSelector((state: RootState) => state.reserves.slots);
  const user = useSelector((state: RootState) => state.user.currentUser);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load data when user changes
  useEffect(() => {
    if (!user) {
      dispatch(setSlots([]));
      setHasLoaded(false);
      return;
    }

    const loadData = async () => {
      try {
        const response = await fetch(`/api/reserves?userId=${encodeURIComponent(user.id)}`);
        if (response.ok) {
          const data = await response.json();
          // Always set slots, even if empty, but only if they are an array
          if (Array.isArray(data)) {
            dispatch(setSlots(data));
          }
        }
      } catch (error) {
        console.error('Failed to load persisted data:', error);
      } finally {
        setHasLoaded(true);
      }
    };

    loadData();
  }, [dispatch, user]);

  // Save data on change
  useEffect(() => {
    // Only save if we have a user and data has been loaded for that user
    if (!hasLoaded || !user) return;

    const saveData = async () => {
      try {
        await fetch(`/api/reserves?userId=${encodeURIComponent(user.id)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(slots),
        });
      } catch (error) {
        console.error('Failed to persist data:', error);
      }
    };

    const timeoutId = setTimeout(saveData, 500); // Debounce save
    return () => clearTimeout(timeoutId);
  }, [slots, hasLoaded, user]);

  return null;
}
