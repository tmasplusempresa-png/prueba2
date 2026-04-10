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
  SEND_RESET_EMAIL_FAILED,
} from "../store/types";

import store from "../store/store";
import { firebase } from "@/config/configureFirebase";
import { onValue, update, ref, off, getDatabase } from "firebase/database";
import {
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import supabase from "@/config/SupabaseConfig";
import base64 from "react-native-base64";
 
import AccessKey from "@/common/other/AccessKey";

import { Dispatch } from "redux";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL ,uploadBytesResumable} from "firebase/storage";

// Helper seguro para obtener la instancia de auth cuando Firebase está inicializado
const getSafeAuth = () => {
  try {
    if (firebase && firebase.auth) return firebase.auth;
    // fallback: si hay apps inicializadas, intentar obtener auth desde el SDK
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const authModule = require('firebase/auth');
    const appModule = require('firebase/app');
    if (appModule && typeof appModule.getApps === 'function' && appModule.getApps().length) {
      return authModule.getAuth();
    }
  } catch (e) {
    // ignore
  }
  return null;
};

export const fetchUser = () => (dispatch) => {
  const { auth, config, singleUserRef } = firebase;

  if (!auth) {
    dispatch({
      type: FETCH_USER_FAILED,
      payload: {
        code: store.getState().languagedata.defaultLanguage.auth_error,
        message: store.getState().languagedata.defaultLanguage.not_logged_in,
      },
    });
    return;
  }

  dispatch({
    type: FETCH_USER,
    payload: null,
  });
  onAuthStateChanged(auth, (user) => {
    if (user) {
      onValue(singleUserRef(user.uid), async (snapshot) => {
        if (snapshot.val()) {
          let profile = snapshot.val();
          profile.uid = user.uid;
          dispatch({
            type: FETCH_USER_SUCCESS,
            payload: profile,
          });
        } else {
          let data = {
            uid: user.uid,
            mobile: "",
            email: "",
            firstName: "",
            lastName: "",
            verifyId: "",
          };

          if (user.providerData.length == 0 && user.email) {
            data.email = user.email;
          }
          if (user.providerData.length > 0 && user.phoneNumber) {
            data.mobile = user.phoneNumber;
          }
          if (user.providerData.length > 0) {
            const provideData = user.providerData[0];
            if (provideData == "phone") {
              data.mobile = provideData.phoneNumber;
            }
            if (
              provideData.providerId == "google.com" ||
              provideData.providerId == "apple.com"
            ) {
              if (provideData.email) {
                data.email = provideData.email;
              }
              if (provideData.phoneNumber) {
                data.mobile = provideData.phoneNumber;
              }
              if (provideData.displayName) {
                if (provideData.displayName.split(" ").length > 0) {
                  data.firstName = provideData.displayName.split(" ")[0];
                  data.lastName = provideData.displayName.split(" ")[1];
                } else {
                  data.firstName = provideData.displayName;
                }
              }
              if (provideData.photoURL) {
                data["profile_image"] = provideData.photoURL;
              }
            }
          }
          if (user.providerData.length > 0 && user.verifyId) {
            data.verifyId = user.verifyId;
          }

          const settings = store.getState().settingsdata.settings;
          let host =
            typeof window !== 'undefined' &&
            window.location &&
            window.location.origin
              ? window.location.origin
              : `https://${config.projectId}.web.app`;
          let url = `${host}/check_auth_exists`;
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Basic " + base64.encode(config.projectId + ":" + AccessKey),
            },
            body: JSON.stringify({ data: JSON.stringify(data) }),
          });
          const json = await response.json();
          if (json.uid) {
            dispatch({
              type: FETCH_USER_SUCCESS,
              payload: json,
            });
          } else {
            dispatch({
              type: FETCH_USER_FAILED,
              payload: {
                code: store.getState().languagedata.defaultLanguage.auth_error,
                message: json.error,
              },
            });
          }
        }
      });
    } else {
      dispatch({
        type: FETCH_USER_FAILED,
        payload: {
          code: store.getState().languagedata.defaultLanguage.auth_error,
          message: store.getState().languagedata.defaultLanguage.not_logged_in,
        },
      });
    }
  });
};

export const signOff = () => (dispatch) => {
  const { singleUserRef, walletHistoryRef, userNotificationsRef } = firebase;

  const auth = getSafeAuth();
  const user = auth?.currentUser;

  if (user) {
    const uid = user.uid;

    off(singleUserRef(uid));
    off(walletHistoryRef(uid));
    off(userNotificationsRef(uid));

    onValue(
      singleUserRef(uid),
      (snapshot) => {
        if (snapshot.val()) {
          const profile = snapshot.val();
          if (profile && profile.usertype === "driver") {
            update(singleUserRef(uid), { driverActiveStatus: false });
          }
          setTimeout(() => {
            signOut(auth)
              .then(() => {
                dispatch({
                  type: USER_SIGN_OUT,
                  payload: null,
                });
              })
              .catch((error) => {
                console.error("Error signing out:", error);
              });
          }, 2000);
        }
      },
      { onlyOnce: true }
    );
  } else {
    console.log("No user is signed in or Firebase Auth not available");
    dispatch({ type: USER_SIGN_OUT, payload: null });
  }
};

export const updateProfile = (updateData: object, imgUri?: string) => {
  return async (dispatch: Dispatch) => {
    try {
      const auth = getSafeAuth();
      const user = auth?.currentUser;

      if (!auth || !user) {
        console.warn('Firebase Auth not available — skipping updateProfile');
        return;
      }
      if (!user) {
        console.warn("Intento de actualizar perfil sin usuario autenticado");
        return;
      }

      const db = getDatabase();
      const userRef = ref(db, `users/${user.uid}`);

      if (imgUri) {
        try {
          const storage = getStorage();
          const imageRef = storageRef(storage, `users/${user.uid}/profile_image.jpg`);

          const response = await fetch(imgUri);
          const blob = await response.blob();
          
          // Subir la imagen a Firebase Storage
          await uploadBytes(imageRef, blob);
          console.log("Imagen subida a Firebase Storage");

          // Liberar el blob después de usarlo
          blob.close && blob.close();

          // Obtener la URL de descarga de la imagen subida
          const downloadURL = await getDownloadURL(imageRef);
          updateData = { ...updateData, profile_image: downloadURL };
        } catch (error) {
          console.error("Error al subir la imagen de perfil:", error);
          throw error;
        }
      }

      await update(userRef, updateData);
      dispatch({ type: 'UPDATE_USER_PROFILE', payload: updateData });

    } catch (error) {
      console.error("Error actualizando perfil:", error);
      throw error;
    }
  };
};

export const updateProfileImage = (imageBlob) => {
  const { auth, singleUserRef, profileImageRef } = firebase;

  const uid = auth.currentUser.uid;

  uploadBytesResumable(profileImageRef(uid), imageBlob)
    .then(() => {
      imageBlob.close();
      return getDownloadURL(profileImageRef(uid));
    })
    .then((url) => {
      update(singleUserRef(uid), {
        profile_image: url,
      });
    });
};

export const updatePushToken = (token: string, platform: string) => {
  return async (dispatch: Dispatch) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const authUser = session?.user;

      if (!authUser) {
        console.warn('updatePushToken: no Supabase session available — skipping');
        return;
      }

      const { error } = await supabase
        .from('users')
        .update({
          push_token: token,
          user_platform: platform,
        })
        .eq('auth_id', authUser.id);

      if (error) {
        console.warn('updatePushToken: Supabase update failed:', error.message);
        return;
      }

      dispatch({
        type: "UPDATE_PUSH_TOKEN",
        payload: token,
      });
    } catch (error) {
      console.error("Failed to update push token:", error);
    }
  };
};

export const updateUserLocation = (latitude: number | undefined, longitude: number | undefined) => {
  return async (dispatch: Dispatch) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const authUser = session?.user;

      if (!authUser) {
        console.log("No user is signed in (Supabase), stopping location update");
        return;
      }

      if (latitude === undefined || longitude === undefined) {
        console.warn("Latitude or Longitude is undefined, skipping update");
        return;
      }

      const { error } = await supabase
        .from('users')
        .update({
          location: { lat: latitude, lng: longitude },
        })
        .eq('auth_id', authUser.id);

      if (error) {
        console.warn('Failed to update location in Supabase:', error.message);
        return;
      }

      dispatch({
        type: "UPDATE_USER_LOCATION",
        payload: { lat: latitude, lng: longitude },
      });
    } catch (error) {
      console.error("Failed to update user location:", error);
    }
  };
};


export const clearLoginError = () => (dispatch) => {
  dispatch({
    type: CLEAR_LOGIN_ERROR,
    payload: null,
  });
};

export const fetchWalletHistory = () => (dispatch) => {
  const { auth, walletHistoryRef } = firebase;

  if (!auth || !auth.currentUser) {
    console.warn('fetchWalletHistory: no firebase auth/currentUser available');
    dispatch({ type: UPDATE_USER_WALLET_HISTORY, payload: [] });
    return;
  }

  const uid = auth.currentUser.uid;

  onValue(walletHistoryRef(uid), (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const arr = Object.keys(data).map((i) => {
        data[i].id = i;
        return data[i];
      });
      dispatch({
        type: UPDATE_USER_WALLET_HISTORY,
        payload: arr.reverse(),
      });
    }
  });
};
export const fetchUserWalletHistory = (userId) => (dispatch) => {
  const { auth, walletHistoryRef } = firebase;
  const uid = userId;

  if (!walletHistoryRef) {
    console.warn('fetchUserWalletHistory: walletHistoryRef not available');
    dispatch({ type: UPDATE_USER_WALLET_HISTORY, payload: [] });
    return;
  }

  onValue(walletHistoryRef(uid), (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const arr = Object.keys(data).map((i) => {
        data[i].id = i;
        return data[i];
      });
      dispatch({
        type: UPDATE_USER_WALLET_HISTORY,
        payload: arr.reverse(),
      });
    } else {
      dispatch({
        type: UPDATE_USER_WALLET_HISTORY,
        payload: [],
      });
    }
  });
};

export const sendResetMail = (email) => async (dispatch) => {
  const { authRef } = firebase;

  dispatch({
    type: SEND_RESET_EMAIL,
    payload: email,
  });
  sendPasswordResetEmail(authRef(), email)
    .then(function () {
      //console.log("Email send successfuly");
    })
    .catch(function (error) {
      dispatch({
        type: SEND_RESET_EMAIL_FAILED,
        payload: {
          code: store.getState().languagedata.defaultLanguage.auth_error,
          message: store.getState().languagedata.defaultLanguage.not_registred,
        },
      });
    });
};

export const verifyEmailPassword = (email, pass) => async (dispatch) => {
  const { authRef } = firebase;

  signInWithEmailAndPassword(authRef(), email, pass)
    .then((user) => {
      //OnAuthStateChange takes care of Navigation
    })
    .catch((error) => {
      dispatch({
        type: USER_SIGN_IN_FAILED,
        payload: error,
      });
    });
};

export const updateAuthMobile = async (mobile, otp) => {
  const { auth, config } = firebase;

  const uid = auth.currentUser.uid;
  const body = {
    uid: uid,
    mobile: mobile,
    otp: otp,
  };

  const settings = store.getState().settingsdata.settings;
  let host =
    typeof window !== 'undefined' &&
    window.location &&
    window.location.origin
      ? window.location.origin
      : `https://${config.projectId}.web.app`;
  let url = `${host}/update_auth_mobile`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (result.success) {
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: error };
  }
};
