// common/store/backgroundTask.ts

import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { store } from './store'; // Importa el store
import { listenForNewBookings } from './bookingsSlice.ts';

const BACKGROUND_FETCH_TASK = 'LISTEN_FOR_NEW_BOOKINGS';

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  const dispatch = store.dispatch;
  const getState = store.getState;

  try {
    //console.log('[BackgroundFetch] fetching new bookings...');
    await listenForNewBookings(dispatch, getState);
    return BackgroundFetch.Result.NewData;
  } catch (error) {
    //console.log('[BackgroundFetch] error:', error);
    return BackgroundFetch.Result.Failed;
  }
});

export const registerBackgroundTask = async () => {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15 * 60, // Intervalo mínimo en segundos (15 minutos)
      stopOnTerminate: false,
      startOnBoot: true,
    });
    ////console.log('Background task registered successfully');
  } catch (error) {
    console.error('Failed to register background task:', error);
  }
};