import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  Modal,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Button,
} from "react-native";
import StarRating from "react-native-star-rating-widget";
import { colors } from "@/scripts/theme";
var { height, width } = Dimensions.get("window");
import { useDispatch, useSelector } from "react-redux";
import { completePaymentBooking } from "@/common/store/bookingsSlice";
import { useRoute } from "@react-navigation/native";

const MAIN_COLOR = "#eeee";

export default function DriverRating(props) {
  const dispatch = useDispatch();
  const route = useRoute();
  const { booking } = route.params;
  const [starCount, setStarCount] = useState(0);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const onChangeText = { onChangeText };
  const [number, onChangeNumber] = React.useState("");

  const onStarRatingPress = (rating) => {
    setStarCount(rating); // Corrected the typo here
};
  const skipRating = () => {
    let curBooking = { ...booking };
    curBooking.status = "COMPLETE";
    dispatch(completePaymentBooking({ booking: curBooking }));
    props.navigation.navigate("HomeScreen");

  };

  const initData = {
    feedback: "",
  };

  const [state, setState] = useState(initData);




  const submitNow = () => {
    
    let curBooking = { ...booking };
    //console.log("Reserva actual antes de la actualización:", curBooking);
    console.log("Estado de la reserva:", curBooking.status);
    curBooking.rating = starCount; // Agregamos la calificación
    console.log("Calificación agregada:", starCount);
    curBooking.feedback = state.feedback; // Agregamos los comentarios
    console.log("Comentarios agregados:", state.feedback);
  curBooking.status = "COMPLETE"; // Cambiamos el estado a COMPLETE
  

    dispatch(completePaymentBooking({ booking: curBooking }))
      .unwrap()
      .then(() => {
        console.log("Navegando a 'BookingActive'");
        props.navigation.navigate("HomeScreen");
      });
  };

  const alertModal = () => {
    return (
      <Modal
        animationType="none"
        transparent={true}
        visible={alertModalVisible}
        onRequestClose={() => {
          setAlertModalVisible(false);
        }}
      >
        <View style={styles.alertModalContainer}>
          <View style={styles.alertModalInnerContainer}>
            <View style={styles.alertContainer}>
              <Text style={styles.rideCancelText}>
                {"no_driver_found_alert_title"}
              </Text>

              <View style={styles.horizontalLLine} />

              <View style={styles.msgContainer}>
                <Text style={styles.cancelMsgText}>{"thanks"}</Text>
              </View>
              <View
                style={[styles.okButtonContainer, { flexDirection: "row" }]}
              >
                <Button
                  title={"no_driver_found_alert_OK_button"}
                  titleStyle={styles.signInTextStyle}
                  onPress={() => {
                    setAlertModalVisible(false);
                    props.navigation.navigate("TabRoot", { screen: "Map" });
                  }}
                  buttonStyle={[styles.okButtonStyle, { flexDirection: "row" }]}
                  containerStyle={styles.okButtonContainerStyle}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  return (
    <View style={[styles.mainViewStyle, { backgroundColor: MAIN_COLOR }]}>
      <View style={{ height: 60 }} />
      <View style={styles.vew}>
        <View style={styles.tripMainView}>
          {booking ? (
            booking.driver_image != "" ? (
              <Image
                source={{ uri: booking.driver_image }}
                style={{
                  height: 100,
                  width: 100,
                  marginTop: -50,
                  borderWidth: 5,
                  borderColor: "white",
                  borderRadius: 50,
                }}
              />
            ) : (
              <Image
                source={require("../../assets/images/Avatar/1.png")}
                style={{
                  height: 100,
                  width: 100,
                  marginTop: -50,
                  borderWidth: 3,
                  borderColor: "white",
                  borderRadius: 50,
                }}
              />
            )
          ) : null}
          <Text style={styles.Drivername}>
            {booking ? booking.driver_name : null}
          </Text>
        </View>
        <KeyboardAvoidingView
          style={styles.form}
          behavior={
            Platform.OS == "ios" ? "padding" : __DEV__ ? null : "padding"
          }
          keyboardVerticalOffset={Platform.OS === "ios" ? 150 : 0}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.ratingViewStyle}>
              <StarRating
                maxStars={5}
                starSize={25}
                enableHalfStar={true}
                color={MAIN_COLOR}
                emptyColor={MAIN_COLOR}
                rating={
                  booking && booking.driverRating ? booking.driverRating : 0
                }
                onChange={() => {
                  ////console.log('hello')
                }}
                style={[{ transform: [{ scaleX: -1 }] }]}
              />
            </View>

            <View
              style={{ flexDirection: "row", marginTop: 10, width: "100%" }}
            >
              {booking && booking.vehicleModel ? (
                <View
                  style={{
                    width: width / 3.25,
                    alignItems: "center",
                    padding: 2,
                  }}
                >
                  <Text style={[styles.textStyleBold, { textAlign: "left" }]}>
                    {"Modelo"}
                  </Text>
                  <Text style={[styles.textStyle, { textAlign: "left" }]}>
                    {booking.vehicleModel}
                  </Text>
                </View>
              ) : null}

              {booking && booking.vehicleMake ? (
                <View style={[styles.hbox2, { minHeight: 35 }]} />
              ) : null}
              {booking && booking.vehicleMake ? (
                <View
                  style={{
                    width: width / 3.25,
                    marginHorizontal: 3,
                    alignItems: "center",
                  }}
                >
                  <Text style={[styles.textStyleBold, { textAlign: "left" }]}>
                    {"Marca"}
                  </Text>
                  <Text style={[styles.textStyle, { textAlign: "left" }]}>
                    {booking.vehicleMake}
                  </Text>
                </View>
              ) : null}
              {booking && booking.vehicle_number ? (
                <View style={[styles.hbox2, { minHeight: 35 }]} />
              ) : null}
              {booking && booking.vehicle_number ? (
                <View
                  style={{
                    width: width / 3.25,
                    marginHorizontal: 2,
                    alignItems: "center",
                  }}
                >
                  <Text style={[styles.textStyleBold, { textAlign: "left" }]}>
                    {"Placa del vehículo"}
                  </Text>
                  <Text style={[styles.textStyle, { textAlign: "left" }]}>
                    {booking.vehicle_number}
                  </Text>
                </View>
              ) : (
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.textStyleBold,
                      { textAlign: "left", marginBottom: 5 },
                    ]}
                  >
                    {" "}
                    {"car_no_not_found"}
                  </Text>
                </View>
              )}
            </View>

            <View
              style={{
                borderWidth: 0.4,
                color: colors.FOOTERTOP,
                marginTop: 15,
                margin: 5,
              }}
            />
            <Text
              style={[
                { textAlign: "center", fontSize: 25, marginTop: 18 },
                styles.textStyleBold,
              ]}
            >
              {"¿Cómo estuvo tu viaje?"}
            </Text>
            <Text
              style={[{ textAlign: "center", marginTop: 10 }, styles.textStyle]}
            >
              {
                "Sus comentarios nos ayudarán a mejorar la experiencia de conducción."
              }
            </Text>
            <Text
              style={[
                { textAlign: "center", marginTop: 20, fontSize: 20 },
                styles.textStyle,
              ]}
            >
              {"Calificación para"}
            </Text>
            <Text
              style={[
                {
                  textAlign: "center",
                  fontSize: 25,
                  textTransform: "capitalize",
                },
                styles.textStyleBold,
              ]}
            >
              {booking && booking.driver_name ? booking.driver_name : null}
            </Text>

            <View style={[styles.ratingViewStyle, { marginVertical: 15 }]}>
              <StarRating
                maxStars={5}
                starSize={50}
                enableHalfStar={true}
                color={'#00f4f5'}
                emptyColor={MAIN_COLOR}
                rating={starCount}
                onChange={(rating) => onStarRatingPress(rating)}
                style={[ { scaleX: 1 }]}
              />
            </View>
            <View
              style={{
                borderColor: colors.GRAY5,
                borderWidth: 1,
                borderRadius: 4,
                marginVertical: 5,
                margin: 10,
              }}
            >
              <TextInput
                multiline={true}
                style={[
                  styles.textInput,
                  { textAlign: "left" },
                  styles.textStyleBold,
                ]}
                placeholder={"Observaciones"}
                onChangeText={(text) => setState({ ...state, feedback: text })}
                value={state.feedback}
                numberOfLines={10}
              />
            </View>
            <View style={{ marginHorizontal: 10 }}>
              <TouchableOpacity style={styles.myButtonStyle}>
                <Text
                  onPress={() => submitNow()}
                  style={[
                    styles.skip,
                    styles.textStyle,
                    { color: "#FFF", fontWeight: "bold" },
                  ]}
                >
                  {" "}
                  Calificar a {booking ? booking.driver_name : null}{" "}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => skipRating()}>
                <Text style={[styles.skip, styles.textStyle]}>{"Omitir"}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
      {alertModal()}
    </View>
  );
}
const styles = StyleSheet.create({
  tripMainView: {
    alignItems: "center",
  },
  ratingViewStyle: {
    flexDirection: "row",
    alignSelf: "center",
  },
  Drivername: {
    color: "#000",
    fontSize: 22,
    textAlign: "center",

    marginTop: 3,
    textTransform: "uppercase",
  },
  Vehicalnumber: {
    fontSize: 15,

    padding: 2,
  },
  vew: {
    flex: 1,
    backgroundColor: colors.WHITE,
    borderRadius: 10,
    marginHorizontal: 10,
    //justifyContent: 'center',
    marginBottom: 10,
  },
  mainViewStyle: {
    flex: 1,
  },
  textInput: {
    textAlign: "left",
    fontSize: 14,
    marginLeft: 5,
    width: width - 50,
    height: 90,
    flexDirection: "column",
    textAlignVertical: "top",
    padding: 5,
    justifyContent: "flex-start",
  },
  form: {
    justifyContent: "space-between",
    flex: 1,
  },
  skip: {
    fontSize: 16,
    padding: 10,
    textAlign: "center",
  },
  myButtonStyle: {
    justifyContent: "center",
    alignContent: "center",
    backgroundColor: "#00f4f5",
    width: "100%",
    height: 50,
    padding: 5,
    borderRadius: 10,
    marginTop: 10,
  },
  textStyle: {
    fontSize: 15,
  },
  textStyleBold: {
    fontSize: 15,
  },
  hbox2: {
    width: 1,
    backgroundColor: MAIN_COLOR,
  },
  signInTextStyle: {},
  alertModalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: colors.BACKGROUND,
  },
  alertModalInnerContainer: {
    height: 200,
    width: width * 0.85,
    backgroundColor: colors.WHITE,
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 7,
  },
  alertContainer: {
    flex: 2,
    justifyContent: "space-between",
    width: width - 100,
  },
  rideCancelText: {
    flex: 1,
    top: 15,
    color: "#000",
    fontSize: 20,
    alignSelf: "center",
  },
  horizontalLLine: {
    width: width - 110,
    height: 0.5,
    backgroundColor: "#000",
    alignSelf: "center",
  },
  msgContainer: { flex: 2.5, alignItems: "center", justifyContent: "center" },
  cancelMsgText: {
    color: "#000",
    fontSize: 15,
    alignSelf: "center",
    textAlign: "center",
  },
  okButtonContainer: {
    flex: 1,
    width: width * 0.85,
    flexDirection: "row",
    backgroundColor: colors.DRIVER_RATING_TEXT,
    alignSelf: "center",
  },
  okButtonStyle: {
    flexDirection: "row",
    backgroundColor: colors.DRIVER_RATING_TEXT,
    alignItems: "center",
    justifyContent: "center",
  },
  okButtonContainerStyle: {
    flex: 1,
    width: width * 0.85,
    backgroundColor: colors.DRIVER_RATING_TEXT,
  },
});
