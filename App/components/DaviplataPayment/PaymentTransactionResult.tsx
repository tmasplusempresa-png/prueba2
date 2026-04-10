import {View, Text, StyleSheet, TouchableOpacity, Image, ScrollView} from "react-native";

import React from "react";
import { useNavigation } from '@react-navigation/native';
import { colors } from "@/scripts/theme";
import { useDispatch } from "react-redux";
import { createMembership } from "@/common/reducers/membershipSlice";
import { addKilometers } from "@/common/reducers/KilometersSlice";
import { useSelector } from "react-redux";
import { RootState } from "@/common/store";

const PaymentTransactionResult = ({transactionResult, redirectSuccessTransaction = 'Map',mode}) => {
    const dispatch = useDispatch();
    console.log(mode);
const user = useSelector((state: RootState) => state.auth.user);
    if (transactionResult && transactionResult.numAprobacion) {
        if (mode === "membership") {
            // Call the function to create the membership
            dispatch(createMembership({ uid: user.id, costo: transactionResult?.valueCost }));
        } else if (mode === "kms") {
            // Call the function to add kilometers
            dispatch(addKilometers({ uid: user.id, kilometersToAdd: mode.kilometers }));
        }
    }
    console.log(transactionResult);
    const navigation = useNavigation();
    return <View style={styles.container}>
            <View style={styles.dataBuyContainer}>
                <View style={styles.transactionContainer}>
                    <Image source={require('@/assets/images/successIcon.png')} style={{width: 30, height: 30}}/>
                    <Text style={styles.textTitleTransaction}>Transacción exitosa</Text>
                </View>
                <Text style={{marginBottom: 15}}>Se ha completado la compra exitosamente.</Text>
                <View style={styles.resultContainer}>
                    <Text style={styles.resultName}>Fecha:</Text>
                    <Text
                        style={{marginBottom: 10}}>{new Date(transactionResult?.fechaTransaccion)?.toLocaleString()}</Text>
                </View>
                <View style={styles.resultContainer}>
                    <Text style={styles.resultName}>Valor:</Text>
                    
                    <Text style={{marginBottom: 10}}>${Number(transactionResult?.valueCost).toLocaleString()} COP</Text>
                </View>
                <View style={styles.resultContainer}>
                    <Text style={styles.resultName}>Número de aprobación:</Text>
                    <Text style={{marginBottom: 10}}>{transactionResult?.numAprobacion}</Text>
                </View>
                <View style={styles.resultContainer}>
                    <Text style={styles.resultName}>Estado:</Text>
                    <Text style={{marginBottom: 10}}>{transactionResult?.estado}</Text>
                </View>
                <TouchableOpacity style={styles.containerButtonEnd} onPress={() => navigation.navigate(redirectSuccessTransaction)
                }>
                    <Text style={styles.textBuyButtonEnd}>Finalizar</Text>
                </TouchableOpacity>
            </View>
        </View>
}

const styles = StyleSheet.create({
    container: {
        paddingTop: 20,
        backgroundColor: colors.WHITE,
        alignItems: 'center',
        display: 'flex',
    },
    titleResult: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    transactionContainer: {
        flexDirection: 'row',
        gap: 6,
        justifyContent: 'center'
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
        padding: 18,
        paddingBottom: 50,
        borderRadius: 10,
        position: 'relative'
    },
    textTitleTransaction: {
        color: 'green',
        fontSize: 20,
        textAlign: 'center',
        marginBottom: 15
    },
    resultContainer: {
        flexDirection: 'row',
    },
    resultName: {
        fontWeight: 'bold',
        marginRight: 5
    },
    containerButtonEnd: {
        borderRadius: 10,
        width: "80%",
        padding: 8,
        backgroundColor: colors.RED_TREAS,
        position: 'absolute',
        bottom: -15,
        left: 22,
    },
    textBuyButtonEnd: {
        fontFamily: 'Roboto-Bold',
        fontWeight: 'bold',
        fontSize: 15,
        color: colors.WHITE,
        marginVertical: 1,
        marginHorizontal: 70,
        textAlign: 'center'
    },
})
export default PaymentTransactionResult;