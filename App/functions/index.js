const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const logger = require("firebase-functions/logger");

admin.initializeApp();
const db = admin.database(); // Cambiar a Realtime Database

// Obtener la clave de la API de Google Maps desde las variables de entorno
const GOOGLE_MAPS_API_KEY = 'AIzaSyDdkvNeB_M3yf_elrPagGAb8kKMARn4oIU'

// Función para compartir la ubicación de un conductor
exports.shareDriverLocation = functions.https.onRequest(async (req, res) => {
  const { bookingId } = req.body;

  if (!bookingId) {
    return res.status(400).send({ error: 'bookingId inválido.' });
  }

  try {
    const bookingSnapshot = await db.ref(`bookings/${bookingId}`).once('value');
    
    if (!bookingSnapshot.exists()) {
      return res.status(404).send({ error: 'Reserva no encontrada.' });
    }

    const bookingData = bookingSnapshot.val();
    const driverId = bookingData.driver;

    // Obtener la ubicación del conductor desde la colección de usuarios
    const driverSnapshot = await db.ref(`users/${driverId}`).once('value');
    
    if (!driverSnapshot.exists()) {
      return res.status(404).send({ error: 'Conductor no encontrado.' });
    }

    const driverData = driverSnapshot.val();
    const driverLocation = driverData.location; // Asegúrate de que este campo sea correcto

    return res.status(200).send({
      message: 'Ubicación del conductor obtenida con éxito',
      location: driverLocation,
    });
  } catch (error) {
    logger.error('Error retrieving driver location:', error);
    return res.status(500).send({ error: 'Error al obtener la ubicación del conductor.' });
  }
});

// Función para buscar un usuario en la base de datos de Firebase
exports.getUserByPhone = functions.https.onRequest(async (req, res) => {
  const phoneNumber = req.query.phone; // Obtener el número de teléfono de la consulta

  if (!phoneNumber) {
    return res.status(400).send("Número de teléfono es requerido");
  }

  try {
    const usersRef = db.ref("users"); // Referencia a la colección de usuarios
    const snapshot = await usersRef.once("value"); // Obtener todos los usuarios

    let foundUser = null;

    snapshot.forEach((childSnapshot) => {
      const userData = childSnapshot.val();
      if (userData.mobile === phoneNumber) { 
        foundUser = { id: childSnapshot.key, mobile: userData.mobile, name: userData.name }; 
      }
    });

    if (!foundUser) {
      return res.status(404).send("Usuario no encontrado");
    }

    return res.status(200).json(foundUser); 
  } catch (error) {
    return res.status(500).send("Error interno del servidor");
  }
});

// Función para escuchar nuevas reservas
exports.listenForNewBookings = functions.database.ref('/bookings/{bookingId}')
    .onCreate(async (snapshot, context) => {
        const booking = snapshot.val();
        const bookingId = context.params.bookingId;

        try {
            // Obtener la ciudad del origen del servicio desde la dirección
            const originCity = await getCityFromAddress(booking.originAddress);
            if (!originCity) {
                return;
            }

            // Obtener todos los tokens de los conductores
            const driversSnapshot = await admin.database().ref('/users').orderByChild('usertype').equalTo('driver').once('value');
            const drivers = driversSnapshot.val();

            if (drivers) {
                const pushTokens = [];

                for (let driverId in drivers) {
                    const driver = drivers[driverId];
                    if (driver.city && driver.city.toLowerCase() === originCity.toLowerCase()) {
                        if (driver.pushToken) {
                            pushTokens.push(driver.pushToken);
                        }
                    }
                }

                if (pushTokens.length > 0) {
                    const notificationData = {
                        tokens: pushTokens,
                        title: "Nueva Reserva",
                        body: `Tienes una nueva reserva de ${booking.carType} en tu ciudad.`,
                    };
                    await axios.post('https://us-central1-treasupdate.cloudfunctions.net/sendNotification', notificationData);
                }
            }
        } catch (error) {
            console.error('Error enviando notificaciones a los conductores:', error);
        }
    });

const getCityFromAddress = async (address) => {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
    );

    if (response.data.status === 'OK') {
      const components = response.data.results[0].address_components;
      const cityComponent = components.find(component => component.types.includes('locality'));
      return cityComponent ? cityComponent.long_name : '';
    }
  } catch (error) {
    console.error('Error fetching city from address:', error);
  }
  return '';
};