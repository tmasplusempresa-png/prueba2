import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as vision from '@google-cloud/vision';
import axios from 'axios';

admin.initializeApp();
const client = new vision.ImageAnnotatorClient();

// Función existente: analyzeImage
export const analyzeImage = functions.https.onRequest(async (req, res) => {
  const { imageBase64 } = req.body;
  try {
    const [result] = await client.textDetection({ image: { content: imageBase64 } });
    const detections = result.textAnnotations;
    res.status(200).send(detections);
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).send({ error: error.message });
  }
});

// Nueva Función: listenForNewBookings
exports.listenForNewBookings = functions.database.ref('/bookings/{bookingId}')
  .onCreate(async (snapshot, context) => {
    const booking = snapshot.val();
    const bookingId = context.params.bookingId;

    //console.log(`Nueva reserva detectada: ${bookingId}`, booking);

    try {
      // Obtener el perfil del conductor
      const driverSnapshot = await admin.database().ref(`/users/${booking.driver}`).once('value');
      const driver = driverSnapshot.val();

      if (driver && driver.pushToken) {
        const payload = {
          notification: {
            title: "Nueva Reserva",
            body: `Tienes una nueva reserva de ${booking.carType}`,
          },
          data: {
            bookingId: bookingId,
          },
        };

        // Enviar notificación al conductor
        await admin.messaging().sendToDevice(driver.pushToken, payload);
        //console.log('Notificación enviada al conductor:', driver.pushToken);
      } else {
        //console.log('No se encontró el pushToken para el conductor:', booking.driver);
      }
    } catch (error) {
      console.error('Error enviando notificación:', error);
    }
  })

// Note: Agora functions are now handled by Supabase Edge Functions
// See: supabase/functions/generateAgoraToken/ and supabase/functions/notifyIncomingCall/