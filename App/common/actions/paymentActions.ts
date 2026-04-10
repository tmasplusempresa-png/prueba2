import { ref, get, update, push, onValue } from "firebase/database";
import { Dispatch } from "redux";
import { RequestPushMsg } from "../utils/pushNotification"; // Asegúrate de tener esta función definida en algún lugar de tu código
import { UPDATE_WALLET_BALANCE, UPDATE_WALLET_BALANCE_FAILED, UPDATE_WALLET_BALANCE_SUCCESS } from "../store/types";
import { database } from "../../config/SupabaseConfig"; // Ajusta la ruta según tu estructura de proyecto


// Referencias Firebase
const walletHistoryRef = (uid: string) => ref(database, `walletHistory/${uid}`);
const singleUserRef = (uid: string) => ref(database, `users/${uid}`);
const settingsRef = ref(database, 'settings');

export const addToWallet = (uid: string, amount: number) => async (dispatch: Dispatch) => {
    try {
        dispatch({
            type: UPDATE_WALLET_BALANCE,
            payload: null
        });

        const settingsSnapshot = await get(settingsRef);
        const settings = settingsSnapshot.val();

        onValue(singleUserRef(uid), snapshot => {
            if (snapshot.exists()) {
                let walletBalance = parseFloat(snapshot.val().walletBalance);
                const pushToken = snapshot.val().pushToken;
                walletBalance = parseFloat((walletBalance + amount).toFixed(settings.decimal));

                const details = {
                    type: 'Credit',
                    amount: amount,
                    date: new Date().getTime(),
                    txRef: 'AdminCredit'
                };

                update(singleUserRef(uid), { walletBalance }).then(() => {
                    push(walletHistoryRef(uid), details).then(() => {
                        dispatch({
                            type: UPDATE_WALLET_BALANCE_SUCCESS,
                            payload: walletBalance
                        });
                    }).catch(error => {
                        dispatch({
                            type: UPDATE_WALLET_BALANCE_FAILED,
                            payload: `${error.code}: ${error.message}`,
                        });
                    });

                    if (pushToken) {
                        RequestPushMsg(pushToken, {
                            title: 'Tienes una notificación',
                            msg: '"Billetera actualizada exitosamente.',
                            screen: 'Wallet'
                        });
                    }
                }).catch(error => {
                    dispatch({
                        type: UPDATE_WALLET_BALANCE_FAILED,
                        payload: `${error.code}: ${error.message}`,
                    });
                });

            }
        }, { onlyOnce: true });

    } catch (error) {
        dispatch({
            type: UPDATE_WALLET_BALANCE_FAILED,
            payload: `${error.code}: ${error.message}`,
        });
    }
};