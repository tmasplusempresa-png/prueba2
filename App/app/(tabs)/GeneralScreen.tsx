import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Select
} from "react-native";
import { RadioButton } from "react-native-paper";

const GeneralScreen = () => {
  const [checked, setChecked] = React.useState("male");

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton}>
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
      <Text style={styles.headerText}>Personal Data</Text>
      <View style={styles.profilePicContainer}>
        <Image
          style={styles.profilePic}
          source={require('./../../assets/images/Avatar/1.png')}
        />
        <TouchableOpacity style={styles.cameraIcon}>
          <Text style={styles.cameraIconText}>📷</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Your Name</Text>
        <TextInput style={styles.input} placeholder="William John Malik" />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Date of Birth</Text>
        {/**
                 <Picker style={styles.picker}>
                    <Picker.Item label="24 December 1999" value="24-12-1999" />
                  
                </Picker>
 */}
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Your Job</Text>
        <TextInput style={styles.input} placeholder="Successor Designer" />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Monthly Income</Text>
      {/**  
       * 
         <Select style={styles.picker}>
          <Select.Item label="$500 - $3000 / year" value="500-3000" />
          {/* Añade más opciones aquí si es necesario }
        </Select>
       */}
      </View>
      <Text style={styles.label}>Gender</Text>
      <View style={styles.radioContainer}>
        <View style={styles.radioButtonContainer}>
          <RadioButton
            value="male"
            status={checked === "male" ? "checked" : "unchecked"}
            onPress={() => setChecked("male")}
          />
          <Text style={styles.radioButtonText}>Male</Text>
        </View>
        <View style={styles.radioButtonContainer}>
          <RadioButton
            value="female"
            status={checked === "female" ? "checked" : "unchecked"}
            onPress={() => setChecked("female")}
          />
          <Text style={styles.radioButtonText}>Female</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 24,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    alignSelf: "center",
  },
  profilePicContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 5,
  },
  cameraIconText: {
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  picker: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  radioContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  radioButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioButtonText: {
    marginLeft: 5,
  },
});

export default GeneralScreen;
