import React from 'react';
import {
  StyleSheet,
  View,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';

export default function AuthLoadingScreen() {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('./../assets/images/splash.png')}
        resizeMode="stretch"
        style={styles.imagebg}
      >
        <ActivityIndicator style={{ paddingBottom: 100 }} color={'#00f4f5'} size='large' />
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  imagebg: {
    flex:1,
    justifyContent: "flex-end",
    alignItems: 'center'
  }
});