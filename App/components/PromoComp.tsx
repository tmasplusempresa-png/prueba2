import React, { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  TextInput,
} from "react-native";
import CustomAlert, { AlertButton } from '@/components/CustomAlert';
import { Avatar, Button } from "react-native-elements";
import { colors } from "@/scripts/theme";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/common/store";
import { editPromo } from "@/common/actions/promoactions";
var { width, height } = Dimensions.get("window");
import { settings } from '@/scripts/settings'

export default function PromoComp(props) {
  const dispatch = useDispatch();
  const promos = useSelector((state: RootState) => state.promodata?.promos || []);
  const [state, setState] = useState("");
  const [selectedPromo, setSelectedPromo] = useState(null); // For storing selected promo

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

  
  const onPressButton = (item, index) => {
    const { onPressButton } = props;
    onPressButton(item, index);
  };

  //console.log( 'promos', promos);
  
  const onPromoButton = () => {
    let promoFound = null;

    if (promos && promos.length > 0) {
      for (let i = 0; i < promos.length; i++) {
        if (promos[i].promo_code === state.toUpperCase()) {
          promoFound = promos[i];
          break;
        }
      }

      if (promoFound) {
        // Apply the promotion
        showAlert('success', 'Promoción Aplicada', `Has aplicado la promoción: ${promoFound.promo_name}  recuerda que el valor se vera reflejado al finalizar el viaje`);

        // Store the applied promotion in state
        setSelectedPromo(promoFound);

        // Log the applied promotion
        console.log("Selected Promotion:", promoFound);

        // Call the parent component's function
        onPressButton(promoFound, promos.indexOf(promoFound)); 
      } else {
        showAlert('warning', 'Alerta', 'Código de promoción no encontrado');
      }
    }
  };


  const renderData = ({ item, index }) => {
    return (
      <View
        style={[
          styles.container,
          { flexDirection:  "row" },
        ]}
      >
        <View
          style={[
            styles.fare,
            styles.shadow,
            { height: "auto", flexDirection:  "row" },
          ]}
        >
          <View
            style={[styles.textViewStyle, { justifyContent: "space-around" }]}
          >
            <View style={{ flexDirection: "column" }}>
              <Text
                style={[
                  styles.couponCode,
                  { textAlign: "left" },
                ]}
              >
                {item.promo_name}
              </Text>
              <Text
                style={[
                  styles.textStyle,
                  { textAlign: "left" },
                ]}
              >
                {item.promo_description}
              </Text>
              <Text style={styles.textStyleBold}>
                {("code")}: {item.promo_code}
              </Text>
            </View>
            {settings.swipe_symbol === false ? (
              <Text
                style={[
                  styles.timeTextStyle,
                  { textAlign: "left" },
                ]}
              >
                { settings.symbol }
                { item.min_order }
                { " - " }
                {("min_order_value")}
                { " - " }
                { settings.symbol }
                { item.min_order }
              </Text>
            ) : (
              <Text
                style={[
                  styles.timeTextStyle,
                  { textAlign: "left" },
                ]}
              >
                {("min_order_value")} {item.min_order}
                {settings.symbol}
              </Text>
            )}
          </View>
          <View style={styles.applyBtnPosition}>
            <View
              style={[
                styles.avatarPosition,
                {
                  justifyContent: "flex-start",
                  paddingVertical: 10,
                },
              ]}
            >
              <Avatar
                size={40}
                rounded
                source={{
                  uri: item.promo_discount_type
                    ? item.promo_discount_type == "flat"
                      ? "https://cdn1.iconfinder.com/data/icons/service-maintenance-icons/512/tag_price_label-512.png"
                      : "https://cdn4.iconfinder.com/data/icons/icoflat3/512/discount-512.png"
                    : null,
                }}
              />
            </View>
            <Button
              title={("apply")}
              TouchableComponent={TouchableOpacity}
              titleStyle={[
                styles.buttonTitleStyle,
                { alignSelf:  "flex-end" },
              ]}
              buttonStyle={[
                styles.confButtonStyle,
                { alignSelf:  "flex-end" },
              ]}
              onPress={() => onPressButton(item, index)}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <>
    <View style={{ flex: 1 }}>
      <View
        style={[
          styles.fare,
          styles.shadow,
          {
            paddingHorizontal: 5,
            flexDirection: "row",
            alignItems: "center",
            minHeight: 60,
            margin: 10,
            justifyContent: "space-between",
            width: '90%'
          },
        ]}
      >
        <View style={[styles.boxView]}>
          <TextInput
            style={ styles.textInput}
            placeholder={("Código Promocional")}
            onChangeText={(text) => setState(text)}
            name={state}
            placeholderTextColor={colors.GRAY5}
          />
        </View>
     
      </View>
      <View style={{ width: 135, alignItems: "center" }}>
          <Button
            title={("aplicar")}
            TouchableComponent={TouchableOpacity}
            titleStyle={[
              styles.buttonTitleStyle,
              { alignSelf:  "flex-end" },
            ]}
            buttonStyle={[
              styles.confButtonStyle,
              { alignSelf:  "flex-end" },
            ]}
            onPress={() => onPromoButton()}
            disabled={state && state.length > 0 ? false : true}
          />
        </View>



      <View style={{ flex: 1, flexDirection: "row" }}>
        <FlatList
          keyExtractor={(item, index) => index.toString()}
          data={promos.filter((item) => item.promo_show)}
          renderItem={renderData}
          showsVerticalScrollIndicator={false}
        />
        <View
          style={{ height: 25, width: "100%", position: "absolute", bottom: 0 }}
        >
         
        </View>
      </View>
    </View>

      <CustomAlert
        visible={alertVisible}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        buttons={alertButtons}
        onDismiss={() => setAlertVisible(false)}
      />
    </>
  );
}
//Screen Styling
const styles = StyleSheet.create({
  container: {
    width: width,
    alignItems: "center",
    justifyContent: "center",
  },
  viewStyle: {
    flexDirection: "row",
    backgroundColor: colors.WHITE,
  },
  borderBottomStyle: {
    borderBottomWidth: 1,
    marginTop: 5,
    borderBottomColor: colors.BORDER_BACKGROUND,
    opacity: 0.3,
  },
  promoViewStyle: {
    flex: 1,
  },
  promoPosition: {
    flexDirection: "row",
  },
  avatarPosition: {
    justifyContent: "flex-start",
    flex: 1.5,
  },
  textViewStyle: {
    justifyContent: "center",
    flex: 1,
    paddingLeft: 10,
  },
  fare: {
    width: width - 20,
    marginTop: 5,
    backgroundColor: colors.WHITE,
    margin: 5,
    borderRadius: 10,
    justifyContent: "center",
    padding: 5,
  },
  applyBtnPosition: {
    justifyContent: "center",
    alignItems: "center",
    width: 115,
  },
  textStyle: {
    fontSize: 15,
    flexWrap: "wrap",
   
  },
  couponCode: {
    
  },
  timeTextStyle: {
    color: colors.PROMO,
    marginTop: 2,
   
  },
  buttonTitleStyle: {
    textAlign: "center",
    color: colors.WHITE,
    fontSize: 15,
   
  },
  confButtonStyle: {
    borderRadius: 6,
    width: 100,
    padding: 5,
    alignSelf: "flex-end",
    backgroundColor: colors.GREEN,
  },
  deleteButtonStyle: {
    backgroundColor: colors.WHITE,
    borderRadius: 6,
    height: 29,
    marginLeft: 8,
    borderColor: colors.HEADER,
    borderWidth: 1,
    width: 85,
  },
  deleteBtnTitleStyle: {
    color: colors.RED,
    textAlign: "center",
    fontSize: 11,
    paddingBottom: 0,
    paddingTop: 0,
  },

  shadow: {
    shadowColor: colors.BLACK,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 1,
    elevation: 5,
  },
  boxView: {
    height: 20,
    justifyContent: "center",
    borderRadius: 4,
    marginVertical: 5,
  },
  textInputRtl: {
    textAlign: "right",
    fontSize: 14,
    marginRight: 5,
  
  },
  textInput: {
    textAlign: "left",
    fontSize: 14,
    marginLeft: 5
  
  },
  textStyleBold: {
    fontSize: 15,
  
  },
});
