// common/actions/api.ts

import { ThunkAction } from 'redux-thunk';
import { AnyAction } from 'redux';
import { RootState } from '../store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { firebase } from '../config/configureFirebase';
import { onValue, update, set, off, child } from 'firebase/database';
import { onAuthStateChanged, signInWithCredential, signOut, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithCustomToken } from 'firebase/auth';
import { uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import base64 from 'react-native-base64';
import AccessKey from '../other/AccessKey';
import {
  FETCH_USER,
  FETCH_USER_SUCCESS,
  FETCH_USER_FAILED,
  USER_SIGN_IN,
  USER_SIGN_IN_FAILED,
  USER_SIGN_OUT,
  CLEAR_LOGIN_ERROR,
  UPDATE_USER_WALLET_HISTORY,
  SEND_RESET_EMAIL,
  SEND_RESET_EMAIL_FAILED
} from '../interfaces/actionTypes';

export const fetchUser = (): ThunkAction<void, RootState, unknown, AnyAction> => dispatch => {
  const { auth, singleUserRef } = firebase;

  dispatch({ type: FETCH_USER });

  onAuthStateChanged(auth, user => {
    if (user) {
      onValue(singleUserRef(user.uid), async snapshot => {
        if (snapshot.val()) {
          const profile = { ...snapshot.val(), uid: user.uid };
          dispatch({ type: FETCH_USER_SUCCESS, payload: profile });
        } else {
          const data = {
            uid: user.uid,
            mobile: '',
            email: '',
            firstName: '',
            lastName: '',
            verifyId: ''
          };

          if (user.email) data.email = user.email;
          if (user.phoneNumber) data.mobile = user.phoneNumber;

          const provideData = user.providerData[0];
          if (provideData) {
            if (provideData.providerId === 'google.com' || provideData.providerId === 'apple.com') {
              data.email = provideData.email || '';
              data.mobile = provideData.phoneNumber || '';
              data.firstName = provideData.displayName?.split(' ')[0] || '';
              data.lastName = provideData.displayName?.split(' ')[1] || '';
              data['profile_image'] = provideData.photoURL || '';
            }
          }

          const settings = store.getState().settingsdata.settings;
          const host = window.location.origin;
          const url = `${host}/check_auth_exists`;
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              "Authorization": "Basic " + base64.encode(`${config.projectId}:${AccessKey}`)
            },
            body: JSON.stringify({ data: JSON.stringify(data) })
          });
          const json = await response.json();
          if (json.uid) {
            dispatch({ type: FETCH_USER_SUCCESS, payload: json });
          } else {
            dispatch({
              type: FETCH_USER_FAILED,
              payload: { code: store.getState().languagedata.defaultLanguage.auth_error, message: json.error }
            });
          }
        }
      });
    } else {
      dispatch({
        type: FETCH_USER_FAILED,
        payload: { code: store.getState().languagedata.defaultLanguage.auth_error, message: store.getState().languagedata.defaultLanguage.not_logged_in }
      });
    }
  });
};

// Other actions...


// Example for another function:

export const saveAddresses = (uid: string, location: any, name: string): ThunkAction<void, RootState, unknown, AnyAction> => async dispatch => {
  const { singleUserRef } = firebase;
  onValue(child(singleUserRef(uid), "savedAddresses"), snapshot => {
    if (snapshot.val()) {
      const addresses = snapshot.val();
      let didNotMatch = true;
      for (const key in addresses) {
        const entry = addresses[key];
        if (entry.name === name) {
          didNotMatch = false;
          update(child(singleUserRef(uid), "savedAddresses/" + key), {
            description: location.add,
            lat: location.lat,
            lng: location.lng,
            count: 1,
            name: name
          });
          break;
        }
      }
      if (didNotMatch) {
        set(child(singleUserRef(uid), "savedAddresses"), {
          description: location.add,
          lat: location.lat,
          lng: location.lng,
          count: 1,
          name: name
        });
      }
    } else {
      set(child(singleUserRef(uid), "savedAddresses"), {
        description: location.add,
        lat: location.lat,
        lng: location.lng,
        count: 1,
        name: name
      });
    }
  }, { onlyOnce: true });
};