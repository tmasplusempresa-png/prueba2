import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Image,
  FlatList,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Platform,
  Keyboard,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { getDatabase, ref, push, onValue } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { useSelector } from 'react-redux';
import { RootState } from '@/common/store';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useColorScheme } from 'react-native';
// Importamos la imagen del administrador
import adminIcon from '../../assets/images/logo1024x1024.png'; // Ajusta la ruta según sea necesario

type Props = NativeStackScreenProps<any>;

const ChatScreen = ({ navigation }: Props) => {
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const route = useRoute();
  const { bookingId, customer_pushToken, driver_pushToken } = route.params;
  const db = getDatabase();
  const auth = getAuth();
  const user = useSelector((state: RootState) => state.auth.user);
  const colorScheme = useColorScheme();
  const flatListRef = useRef<FlatList>(null);
  const styles = colorScheme === "dark" ? darkStyles : lightStyles; // Estilos dinámicos

  useEffect(() => {
    const messagesRef = ref(db, `chats/${bookingId}/messages`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsedMessages = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setMessages(parsedMessages);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [bookingId]);

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (newMessage.trim() === '') return;

    const messageData = {
      createdAt: new Date().toISOString(),
      from: user.uid,
      message: newMessage,
      msgDate: new Date().toLocaleString(),
      Source: user.usertype,
      type: 'text',
    };

    const messagesRef = ref(db, `chats/${bookingId}/messages`);
    await push(messagesRef, messageData);
    setNewMessage('');

    // Lógica de notificaciones (opcional)
    const pushToken =
      user.usertype === 'driver' ? customer_pushToken : driver_pushToken;
    const notificationData = {
      tokens: [pushToken],
      title: `Nuevo mensaje de ${user.firstName}`,
      body: newMessage,
    };
    console.log(notificationData);

    try {
      await fetch(
        'https://us-central1-treasupdate.cloudfunctions.net/sendMassNotification',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notificationData),
        }
      );
    } catch (error) {
      console.error('Error enviando notificación:', error);
    }
  };

  const renderItem = ({ item }) => {
    const isCurrentUser = item.from === user.uid;
    const isAdminMessage = item.Source === 'admin';

    const messageAlignment = isCurrentUser
      ? 'flex-end'
      : isAdminMessage
      ? 'center'
      : 'flex-start';

    const messageBackgroundColor = isCurrentUser
      ? '#E91E63'
      : isAdminMessage
      ? '#00f4f5'
      : '#E5E5EA';

    const messageTextColor = isCurrentUser || isAdminMessage ? '#fff' : '#000';

    return (
      <View
        style={{
          flexDirection: 'row',
          justifyContent: messageAlignment,
          marginVertical: 5,
        }}
      >
        <View
          style={{
            backgroundColor: messageBackgroundColor,
            padding: 10,
            borderRadius: 10,
            maxWidth: '70%',
          }}
        >
          {/* Mostrar la imagen y el nombre si el mensaje es del administrador */}
          {isAdminMessage && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 5,
              }}
            >
              <Image
                source={adminIcon}
                style={{ width: 20, height: 20, marginRight: 5, borderRadius: 9999 }}
              />
              <Text style={{ color: messageTextColor, fontWeight: 'bold' }}>
                T+Plus Admin
              </Text>
            </View>
          )}

          {/* Contenido del mensaje */}
          {item.type === 'text' ? (
            <Text style={{ color: messageTextColor }}>{item.message}</Text>
          ) : (
            <Image
              source={{ uri: item.message }}
              style={{ width: 200, height: 150, borderRadius: 10 }}
            />
          )}

          {/* Marca de tiempo */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 5,
            }}
          >
            <Text style={{ color: messageTextColor, fontSize: 12 }}>
              {isCurrentUser
                ? 'Tú'
                : isAdminMessage
                ? 'Admin'
                : ''}{' '}
              {item.msgDate}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Mensajes predefinidos (opcional)
  const predefinedMessages =
    user.usertype === 'driver'
      ? [
          'Estoy en camino.',
          'Llegaré en 5 minutos.',
          'Estoy aquí.',
          'Gracias por tu paciencia.',
          '¿Puedes darme más detalles?',
        ]
      : user.usertype === 'customer'
      ? [
          'Hola, ¿cómo estás?',
          '¿Necesitas ayuda?',
          'Gracias por tu mensaje.',
          'Estoy en camino.',
          '¿Puedes darme más detalles?',
        ]
      : []; // Administrador no tiene mensajes predefinidos

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={90} // Ajuste importante para evitar que el input quede tapado en iOS
    >
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }}>
      <View
        style={{
          height: 60,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 15,
          borderBottomWidth: 1,
          borderBottomColor: '#ddd',
          
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color={colorScheme === 'dark' ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colorScheme === 'dark' ? '#fff' : '#000' }}>Chat</Text>
        <TouchableOpacity>
          <Ionicons name="settings" size={24} color={colorScheme === 'dark' ? '#fff' : '#000'} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 15 }}
        style={{ flex: 1 }}
      />

      <View style={{ borderTopWidth: 1, borderTopColor: '#ddd' }}>
        {predefinedMessages.length > 0 && (
          <ScrollView
            horizontal={true}
            style={{ paddingHorizontal: 15, paddingVertical: 0 }}
            contentContainerStyle={{ alignItems: 'center' }}
          >
            {predefinedMessages.map((msg, index) => (
              <TouchableOpacity
                key={index}
                style={styles.predefinedButton}
                onPress={() => setNewMessage(msg)}
              >
                <Text style={styles.predefinedText} numberOfLines={1}>
                  {msg}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 15,
            paddingVertical: 5,
           
          }}
        >
          <TextInput
            style={styles.input}
            placeholder="Empieza a escribir..."
            value={newMessage}
            onChangeText={setNewMessage}
          />
          <TouchableOpacity onPress={sendMessage}>
            <FontAwesome name="send" size={24} color="#00f4f5" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
    </TouchableWithoutFeedback>
  </KeyboardAvoidingView>
  );
};


const lightStyles = StyleSheet.create({
  predefinedButton: {
    backgroundColor: '#E0F7FA',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginRight: 10,
    maxWidth: 200,
    maxHeight: 40,
    justifyContent: 'center',
    marginTop: 10,
  },
  predefinedText: {
    color: '#000',
    fontSize: 14,
    flexShrink: 1,
    flexWrap: 'nowrap',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 10,
    backgroundColor: '#f9f9f9',
  },
});
const darkStyles = StyleSheet.create({
  predefinedButton: {
    backgroundColor: '#333', // Cambia el color de fondo para el modo oscuro
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginRight: 10,
    maxWidth: 200,
    maxHeight: 40,
    justifyContent: 'center',
    marginTop: 10,
  },
  predefinedText: {
    color: '#fff', // Cambia el color del texto para el modo oscuro
    fontSize: 14,
    flexShrink: 1,
    flexWrap: 'nowrap',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#555', // Cambia el color del borde para el modo oscuro
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 10,
    backgroundColor: '#222', // Cambia el color de fondo del input para el modo oscuro
    color:'#fff'
  },
});

export default ChatScreen;


