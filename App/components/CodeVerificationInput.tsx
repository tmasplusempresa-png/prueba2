import React, {useEffect, useState} from 'react';
import {StyleSheet, Button, Text, View, Dimensions, Platform, TouchableOpacity} from 'react-native';
import {
    CodeField,
    Cursor,
    useBlurOnFulfill,
    useClearByFocusCell,
} from 'react-native-confirmation-code-field';

import {codeLength} from "../constants/daviplata.constants";
import { colors } from '@/scripts/theme';

const CELL_COUNT = codeLength;

const CodeVerificationInput = ({value, setValue}) => {
    const ref = useBlurOnFulfill({value, cellCount: CELL_COUNT});
    const [props, getCellOnLayoutHandler] = useClearByFocusCell({
        value,
        setValue,
    });
    const changeValueText = () => {
        setValue(value);
    }
    return <CodeField
        ref={ref}
        value={value}
        onChangeText={setValue}
        cellCount={CELL_COUNT}
        rootStyle={styles.codeFieldRoot}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        renderCell={({index, symbol, isFocused}) => (
            <Text
                key={index}
                style={[styles.cell, isFocused && styles.focusCell]}
                onLayout={getCellOnLayoutHandler(index)}>
                {symbol || (isFocused ? <Cursor/> : null)}
            </Text>
        )}
    />
}
const styles = StyleSheet.create({
    root: {flex: 1, padding: 20},
    title: {textAlign: 'center', fontSize: 30},
    codeFieldRoot: {marginTop: 20, width :  280},
    cell: {
        width: 40,
        height: 40,
        lineHeight: 38,
        fontSize: 24,
        borderWidth: 2,
        borderColor: '#00000030',
        borderRadius : 8,
        textAlign: 'center',
    },
    focusCell: {
        borderColor: colors.RED_DAVIPLATA,
    },
});

export default CodeVerificationInput