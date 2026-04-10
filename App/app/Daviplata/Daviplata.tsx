import React, { useEffect, useState } from 'react';
import {
    View,
    StyleSheet,
    Image,
    Dimensions,
    TouchableOpacity,
    Text,
    TextInput,
    ActivityIndicator,
    ScrollView,
    Platform
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { codeLength, identificationNumberMappingDev, typeDocumentMapping } from "@/constants/daviplata.constants";
import Modal from "react-native-modal";
import { useRoute } from "@react-navigation/native";
// Importing `expo-notifications` at module top-level causes it to attempt
// automatic device push token registration which errors in Expo Go. Use
// dynamic import when needed so we can guard by `Constants.appOwnership`.
import Constants from 'expo-constants';
import RNPickerSelect from "react-native-picker-select";

var { width, height } = Dimensions.get('window');

import { Picker } from "@react-native-picker/picker";
import { colors } from '@/scripts/theme';
import { MAIN_COLOR } from '@/common/other/sharedFunctions';
import PaymentTransactionResult from '@/components/DaviplataPayment/PaymentTransactionResult';
import CodeVerificationInput from '@/components/CodeVerificationInput';
import { AppDispatch, RootState } from '@/common/store/store';
import { createMembership } from '@/common/reducers/membershipSlice';
import { addKilometers } from '@/common/reducers/KilometersSlice';
import { AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import CustomAlert, { AlertButton } from '@/components/CustomAlert';
const MINUTES_EXPIRATION_CODE = 3;
const SECONDS_EXPIRATION_CODE = 0;

const DaviplataPayment = (props) => {
    const user = useSelector((state: RootState) => state.auth.user);

    const route = useRoute();
    const paymentDetail = route.params?.payData;
    const redirectSuccessTransactionRoute = route.params?.redirectSuccessTransaction;
    const [valueCode, setValueCode] = useState('');
    const [isModalCodeInputVisible, setModalCodeInputVisible] = useState(false);
    const [isModalPayTransaction, setModalPayTransaction] = useState(false);
    const [isModalPayDaviplataTransaction, setModalPayDaviplataTransaction] = useState(false);
    const [otpGenerated, setOTPGenerated] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [idSessionToken, setIdSessionToken] = useState('');
    const [messageError, setMessageError] = useState(null);
    const [messageTransaction, setMessageTransaction] = useState('');
    const [confirmedPaymentResult, setConfirmedPaymentResult] = useState(null);
    const amount = route?.params?.amount || 0; // Provide a default value if amount is undefined
    const dispatch = useDispatch<AppDispatch>();
    const [loading, setLoading] = useState(false);
    const [payValues, setPayValues] = useState({
        documentType: user.docType || '',
        identificationNumber: user.verifyId || '',
        nameCustomer: `${user.firstName} ${user.lastName}` || '',
        buyValue: amount || 0
    })
    const navigation = useNavigation();
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info' | 'confirm'>('error');
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertButtons, setAlertButtons] = useState<AlertButton[]>([]);
    const showAlert = (type: 'success' | 'error' | 'warning' | 'info' | 'confirm', title: string, message: string, buttons?: AlertButton[]) => {
        setAlertType(type);
        setAlertTitle(title);
        setAlertMessage(message);
        setAlertButtons(buttons || [{ text: 'OK', onPress: () => setAlertVisible(false) }]);
        setAlertVisible(true);
    };
    const documentTypeMapping = {
        'CC': '01',
        'CE': '02',
        'TI': '04',
        'Pasaporte': '03' // Asumiendo que el pasaporte sería '03'
    };

    const [timeLeft, setTimeLeft] = useState({
        minutes: MINUTES_EXPIRATION_CODE,
        seconds: SECONDS_EXPIRATION_CODE,
    });
    console.log(route.params);
    const isvisible = false;
    useEffect(() => {
        if (messageError?.code === "401" && !isModalPayDaviplataTransaction) {
            const timeoutId = setTimeout(() => {
                setModalPayTransaction(true);
            }, 2000);

            return () => clearTimeout(timeoutId); // Limpiar el timeout si el componente se desmonta o las dependencias cambian
        }
    }, [messageError, isModalPayDaviplataTransaction]);

    useEffect(() => {
        // Esta función se inicializará sólo cuando isModalPayDaviplataTransaction cambie.
        if (isModalPayDaviplataTransaction) {
            const intervalId = setInterval(() => {
                setTimeLeft(prevTime => {
                    if (prevTime.seconds > 0) {
                        // Decrementar solo segundos si aún quedan
                        return { ...prevTime, seconds: prevTime.seconds - 1 };
                    } else if (prevTime.minutes > 0) {
                        // Decrementar minutos y resetear segundos si se acaban los segundos
                        return { minutes: prevTime.minutes - 1, seconds: 59 };
                    } else {
                        // Tiempo expirado, manejar evento aquí
                        clearInterval(intervalId); // Detener el intervalo
                        setModalPayDaviplataTransaction(false); // Cerrar el modal
                        showMessageError({
                            code: '3000',
                            messageError: 'Codigo OTP Vencído'
                        });
                        return prevTime; // Devolver el tiempo previo para evitar más cambios
                    }
                });
            }, 1000);

            return () => clearInterval(intervalId); // Limpieza del intervalo cuando el componente se desmonte o el modal se cierre
        }
    }, [isModalPayDaviplataTransaction]); // Dependencia solo en la visibilidad del modal




    //este es el que medio funciona 
    useEffect(() => {
        let intervalId;
        if (isModalPayDaviplataTransaction && (timeLeft.minutes > 0 || timeLeft.seconds > 0)) {
            intervalId = setInterval(() => {
                setTimeLeft((prevTime) => {
                    if (prevTime.seconds > 0) {
                        return {
                            ...prevTime,
                            seconds: prevTime.seconds - 1,
                        };
                    } else if (prevTime.minutes > 0) {
                        return {
                            minutes: prevTime.minutes - 1,
                            seconds: 59,
                        };
                    } else {
                        clearInterval(intervalId);
                        setModalPayDaviplataTransaction(false);
                        showMessageError({
                            code: '3000',
                            messageError: 'Código OTP Vencido'
                        });
                    }
                });
            }, 1000);
        }
        return () => clearInterval(intervalId);
    }, [timeLeft, isModalPayDaviplataTransaction]);

    const onChangePayValues = (key, value) => {
        setPayValues({
            ...payValues,
            [key]: value
        })
    }

    useEffect(() => {

    }, [isModalPayDaviplataTransaction]);

    const showModal = () => {
        setModalPayDaviplataTransaction(true);
    };

    const getAccessTokenDaviplata = async () => {
        resetTransaction();
        const endpoint = `https://us-central1-treasupdate.cloudfunctions.net/daviplata-oauthDaviplata`;
        const response = await axios.post(endpoint);
        return response.data.access_token;
    };


    const resetTransaction = () => {
        setOTPGenerated('');
        setAccessToken('');
        setValueCode('');
        setMessageError('');
        setTimeLeft({
            minutes: MINUTES_EXPIRATION_CODE,
            seconds: SECONDS_EXPIRATION_CODE
        })
    }
    const buyTransactionDaviplata = async (accessToken) => {
        try {


            const endpoint = `https://us-central1-treasupdate.cloudfunctions.net/daviplata-buyTransactionDaviplata`;
            const documentType = documentTypeMapping[payValues.documentType];
            const buyValue = payValues.buyValue;
            const identificationNumber = payValues.identificationNumber;


            const daviplataDocumentType = payValues.documentType;

            console.log("identificacion", identificationNumber, buyValue, documentType, accessToken);
            const response = await axios.post(
                endpoint,
                {
                    buyValue: buyValue,
                    identificationNumber: identificationNumber,
                    documentType: documentType,
                    accessToken: accessToken
                },
            );
            showModal()
            console.log(response.data, "------")
            return response.data;
        } catch (error) {
            showMessageError(error.response?.data.code ? error.response?.data : {
                code: '500',
                messageError: 'Ha ocurrido un error en el pago, intente de nuevo'
            });
        }
    };

    const readOtpInDevMode = async () => {
        const endpoint = `https://us-central1-treasupdate.cloudfunctions.net/daviplata-readOtpDaviplata`;
        const documentType = documentTypeMapping[payValues.documentType];
        const identificationNumber = user.verifyId;
        const response = await axios.post(
            endpoint,
            {
                identificationNumber,
                documentType: documentType,
                notificationType: 'API_DAVIPLATA'
            },
        );
        return response.data;
    }



    const confirmBuyDaviplata = async ({ otp, idSessionToken, accessToken }) => {
        try {

            const valueCost = payValues.buyValue;
            console.log(valueCost);
            setModalPayTransaction(false);
            setMessageTransaction('Validando Código');
            setModalCodeInputVisible(false)
            const endpoint = `https://us-central1-treasupdate.cloudfunctions.net/daviplata-confirmBuyDaviplata`;
            const response = await axios.post(
                endpoint,
                {
                    accessToken,
                    otp,
                    idSessionToken,
                    idComercio: "0010203040",
                    idTerminal: "ESB10934"
                },
            );
            setModalPayTransaction(false);
            const newData = { ...response.data, valueCost: valueCost };
            setConfirmedPaymentResult(newData);
            console.log(response.data, "daniel");

       

            return response.data;
        } catch (error) {
            console.log("desde aqui")
            showMessageError(error.response?.data.code ? error.response?.data : {
                code: '500',
                messageError: 'Ha ocurrido un error en el pago, intente de nuevo'
            });
        }
    }



    const payDevModeProcess = async ({ accessToken, idSessionToken }) => {
        const otpResponse = await readOtpInDevMode() // Solo en desarrollo se lee el OTP automaticamente;
        console.log('confirmar compra automaticamente');
        const otp = otpResponse.otp;
        console.log(otpResponse, "otp daniel")

                let notificationId = null;
                if (Constants.appOwnership === 'expo') {
                    console.warn('expo-notifications: scheduling disabled in Expo Go; use dev client to test.');
                } else {
                    const Notifications = await import('expo-notifications');
                    notificationId = await Notifications.scheduleNotificationAsync({
                        content: {
                            title: 'T+Plus',
                            body: `Tu código de verificación es ${otp},!`,
                            ios: {
                                sound: 'default',
                            },
                            android: {
                                sound: 'default',
                            }
                        },
                        trigger: null,
                    });
                }
                console.log('Notificación enviada con ID:', notificationId);


    }

    const handleBuyButtonPress = async () => {

        try {
            resetTransaction();
            if (Object.values(payValues).some(value => value === '')) {
                showAlert('error', 'Error al pagar', 'Por favor ingrese todos los datos para poder completar el pago');
                return;
            }

            setModalPayTransaction(false);
            setMessageTransaction('Procesando compra...');
            const accessToken = await getAccessTokenDaviplata();
            const buyResponse = await buyTransactionDaviplata(accessToken);
            console.log(buyResponse, "tampoco llego")
            const idSessionToken = buyResponse?.idSessionToken;
            setAccessToken(accessToken);

            setIdSessionToken(idSessionToken);


            if (!accessToken) {
                throw new Error('No se pudo obtener el token de acceso');

            }


            setMessageTransaction('');



            await payDevModeProcess({ accessToken, idSessionToken });


            setModalCodeInputVisible(true);
            console.log(isModalCodeInputVisible);
        } catch (error) {
            // console.log("error daniel")
            // showMessageError(error.response?.data.code ? error.response?.data : {
            //     code: '500',
            //     messageError: 'Ha ocurrido un error en el pago, intente de nuevo'
            // });
        }
    };



    const showMessageError = (message) => {
        console.log(message, "------");
        if (message.code == "401") {
            setMessageError({
                code: '401',
                messageError: 'Autenticación Denegada - OTP invalido'
            });

        }
        if (message.code == "0321" && "PRODUCTO NO EXISTE") {
            setMessageError({
                code: '0321',
                messageError: 'PRODUCTO NO EXISTE-Porfavor verifíque su cedula e intentelo de nuevo.'
            });
        }
        if (message.code == "400" && message.messageError === "Operacion declinada") {
            setMessageError({
                code: '400',
                messageError: 'Operacion declinada-Porfavor verifíque su saldo e intentelo de nuevo.'
            });
        }
        if (message.code == "500" && message.messageError === "Operacion declinada") {
            setMessageError({
                code: '400',
                messageError: 'Operacion declinada-Porfavor verifíque su saldo e intentelo de nuevo.'
            });
        }
        if (message.code == "500" && message.messageError === "Saldo insuficiente") {
            setMessageError({
                code: '500',
                messageError: 'Saldo insuficiente'
            });
        }
        if (message.code == "500" && message.messageError === "Ha ocurrido un error en el pago, intente de nuevo") {
            setMessageError({
                code: '500',
                messageError: 'Saldo insuficiente'
            });
        }
        if (message.code == "3000") {
            setMessageError({
                code: '',
                messageError: 'OTP Vencído'
            });
        }
        /* if (message.code == "500") {
             setMessageError({
                 code: '500',
                 messageError: 'Ha ocurrido un error de autenticación'
             });
 
         }*/


        setModalPayTransaction(true);
        setLoading(false);
    }
    return (<ScrollView>
        <View style={styles.container}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <AntDesign name="arrowleft" size={24} color="#000" />
            </TouchableOpacity>
            <Image source={require('./../../assets/payment-icons/daviplata-logo.png')}
                style={{ width: '80%', height: 100 }} />
            {!confirmedPaymentResult ? <>
                <Text style={styles.titleBuy}>Detalles del Pago</Text>
                <View style={styles.dataBuyContainer}>
                    <View>
                        <Text style={styles.titleData}>Nombre cliente</Text>
                        <View style={styles.dataValueBuyContainer}>
                            <TextInput style={[styles.textStyle]} defaultValue={payValues.nameCustomer}
                                onChangeText={(value) => onChangePayValues('nameCustomer', value)} />
                        </View>
                    </View>
                    <View>
                        <Text style={styles.titleData}>Documento de identidad</Text>
                        <View style={styles.valuesDocumentContainer}>
                            <View style={[styles.dataValueBuyContainer, styles.docTypeContainer]}>
                                {Platform.OS === "android" ? <Picker
                                    style={{ height: 44, padding: 0, marginLeft: -16, marginTop: -14 }}
                                    selectedValue={payValues.documentType}
                                    onValueChange={(itemValue,) =>
                                        onChangePayValues('documentType', itemValue)
                                    }>
                                    <Picker.Item label="Cedula de Ciudadanía" value="CC" />
                                    <Picker.Item label="Tarjeta de Identidad" value="TI" />
                                    <Picker.Item label="Cedula de Extranjería" value="CE" />
                                </Picker> :

                                    <RNPickerSelect
                                        onValueChange={(itemValue) => onChangePayValues('documentType', itemValue)}
                                        items={[
                                            { label: "Cedula de Ciudadanía", value: "CC" },
                                            { label: "Tarjeta de Identidad", value: "TI" },
                                            { label: "Cedula de Extranjería", value: "CE" },
                                        ]}
                                        placeholder={{ label: "Seleccione un tipo de documento", value: null }}
                                        style={{
                                            inputIOS: {
                                                color: "black",
                                                fontSize: 16,
                                                paddingHorizontal: 10,
                                                paddingVertical: 8,
                                                //borderWidth: 1,
                                                borderColor: "#a1a3a6",
                                                borderRadius: 10,
                                                backgroundColor: "#fff",
                                            }
                                        }}
                                    />}
                            </View>

                        </View>
                    </View>
                    <View>
                        <Text style={styles.titleData}>Número de documento</Text>
                        <View style={styles.dataValueBuyContainer}>
                            <TextInput style={[styles.textStyle]} defaultValue={payValues.identificationNumber}
                                onChangeText={value => onChangePayValues('identificationNumber', value)} />
                        </View>
                    </View>
                    <View>
                        <Text style={styles.titleData}>Valor de la compra</Text>
                        <View style={styles.dataValueBuyContainer}>
                            <Text style={styles.textStyle}>${Number(payValues.buyValue).toLocaleString()}COP</Text>

                        </View>
                    </View>
                    <TouchableOpacity style={[styles.containerBotton, { backgroundColor: 'red' }]} onPress={() => { handleBuyButtonPress(); setLoading(true); }}>
                        {!isModalCodeInputVisible && loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.textBuyButton}>Pagar</Text>
                        )}
                    </TouchableOpacity>
                </View></> : <PaymentTransactionResult transactionResult={confirmedPaymentResult}
                    redirectSuccessTransaction={redirectSuccessTransactionRoute} mode={route.params?.mode}/>}



            <Modal isVisible={isModalPayTransaction}>
                <View style={styles.modalView}>
                    {messageError ? <View style={{ marginTop: 10 }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 16 }}>Error en el pago</Text>
                        <Text style={{ marginBottom: 15 }}>{messageError?.code} - {messageError?.messageError}</Text>
                        <TouchableOpacity style={styles.cancelButton}
                            onPress={() => setModalPayTransaction(false)}>
                            <Text style={styles.cancelButtonText}>Ok</Text>
                        </TouchableOpacity>
                    </View> : <View>
                        <Text style={styles.processingBuy}>{messageTransaction}...</Text>
                        <ActivityIndicator size="large" color={colors.RED_TREAS} /></View>}
                </View>
            </Modal>
            <Modal isVisible={isModalPayDaviplataTransaction}>
                <View style={styles.modalView}>
                    {messageError ? (
                        <View style={{ marginTop: 10 }}>
                            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 16 }}>Error en el pago</Text>
                            <Text style={{ marginBottom: 15 }}>{messageError?.code} - {messageError?.messageError}</Text>
                            <TouchableOpacity style={styles.cancelButton}
                                onPress={() => setModalPayDaviplataTransaction(false)}>
                                <Text style={styles.cancelButtonText}>Ok</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.titleValidation}>Validación de codigo</Text>
                            <Text style={styles.subtitleValidation}>Por favor digite el codigo de verificación enviado a su dispositivo móvil.</Text>
                            <Text style={{ marginTop: 10, fontSize: 20, fontWeight: 'bold' }}>
                                {`${timeLeft.minutes.toString().padStart(2, '0')}:${timeLeft.seconds.toString().padStart(2, '0')}`}
                            </Text>
                            <CodeVerificationInput value={valueCode} setValue={setValueCode} />
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity style={styles.cancelButton}
                                    onPress={() => {
                                        showMessageError({
                                            code: '401',
                                            messageError: 'Autenticación Denegada - Acción Cancelada'
                                        });
                                    }}>
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.sendButton,
                                        valueCode.length < codeLength ? { display: 'none' } : null // Ocultar si no tiene datos
                                    ]}
                                    onPress={() => {
                                        confirmBuyDaviplata({
                                            otp: valueCode,
                                            idSessionToken,
                                            accessToken,
                                        });
                                        setModalPayDaviplataTransaction(false);  // Cerrar el modal después de enviar el código
                                    }}
                                >
                                    <Text style={styles.sendButtonText}>Enviar Código</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </Modal>
        </View>
        <CustomAlert visible={alertVisible} type={alertType} title={alertTitle} message={alertMessage} buttons={alertButtons} onDismiss={() => setAlertVisible(false)} />
    </ScrollView>
    );
}


const styles = StyleSheet.create({
    container: {
        paddingTop: 20,
        height: height,
        backgroundColor: colors.WHITE,
        alignItems: 'center',
        display: 'flex',
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 1,
    },
    dataBuyContainer: {
        backgroundColor: 'white',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
        padding: 13,
        width: '85%',
        paddingBottom: 50,
        borderRadius: 10,
        position: 'relative'
    },
    titleBuy: {
        fontFamily: 'Roboto-Bold',
        fontWeight: 'bold',
        fontSize: 20,
        marginTop: 15,
        marginBottom: 15
    },
    textStyle: {
        fontSize: 16,
    },
    dataValueBuyContainer: {
        borderStyle: 'solid',
        borderBottomWidth: 1,
        borderColor: "#50514F",
        padding: 5,
        paddingLeft: 0
    },
    titleData: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 10
    },
    valuesDocumentContainer: {
        flexDirection: "row",
        gap: 10
    },
    docTypeContainer: {
        flex: 2
    },
    verifyIdContainer: {
        flex: 3
    },
    containerInput: {
        borderWidth: 1,
        marginHorizontal: 30,
        marginVertical: 10,
        borderRadius: 10,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',

    },
    processingBuy: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 12
    },
    containerBotton: {
        borderRadius: 10,
        width: "80%",
        padding: 8,
        backgroundColor: colors.RED_TREAS,
        position: 'absolute',
        bottom: -15,
        left: 39,
    },
    textBuyButton: {
        fontFamily: 'Roboto-Bold',
        fontWeight: 'bold',
        fontSize: 15,
        color: colors.WHITE,
        marginVertical: 1,
        marginHorizontal: 70,
        textAlign: 'center'
    },
    modalView: {
        margin: 10,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    titleValidation: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    subtitleValidation: {
        marginTop: 10,
        fontSize: 12,
        width: 280
    },
    buttonContainer: {
        marginTop: 20,
        flexDirection: "row",
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        width: '100%'
    },
    cancelButton: {
        padding: 10,
        backgroundColor: colors.WHITE,
        borderWidth: 2,
        borderRadius: 8,
        borderColor: colors.RED_TREAS,
    },
    disabledButton: {
        opacity: 0.5,
        backgroundColor: MAIN_COLOR,
    },
    cancelButtonText: {
        color: colors.RED_DAVIPLATA,
        fontWeight: 'bold',
        fontFamily: 'Roboto-Bold',
        textAlign: 'center',
    },
    sendButton: {
        padding: 10,
        borderRadius: 8,
        backgroundColor: 'red',
        flex: 2
    },
    sendButtonText: {
        color: colors.WHITE,
        fontWeight: 'bold',
        fontFamily: 'Roboto-Bold',
        textAlign: 'center',
    }
})

export default DaviplataPayment;
