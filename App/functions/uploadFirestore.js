const admin = require('firebase-admin');
const serviceAccount = require('../accountservices.json');

// Inicializa Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Los datos que deseas subir
const appConfigData = {
  AppleLoginEnabled: true,
  AppleStoreLink: "https://apps.apple.com/app/treasapp/id6456222848",
  BookLaterDate: "4000",
  CarHornRepeat: true,
  CommisionHotel: 0.1,
  CompanyAddress: "Bogotá, Colombia",
  CompanyName: "Treas Corp SAS",
  CompanyPhone: "573118841054",
  CompanyPolitics: "https://tmasplus.com/politica-de-privacidad",
  CompanyTermCondition: "https://tmasplus.com/terminos-y-condiciones",
  CompanyTerms: "https://tmasplus.com/politica-de-privacidad",
  CompanyTreatment: "https://tmasplus.com/tratamiento-de-datos",
  CompanyWebsite: "https://www.tmasplus.com",
  DinamikLink: "https://treasapp.page.link/app",
  FacebookHandle: "https://facebook.com/t/",
  FacebookLoginEnabled: true,
  Increase: "1.3",
  InstagramHandle: "https://instagram.com/tmasplus",
  KilimetrsWallet: true,
  ListCities: "Bogotá, Medellín, Cali, Barranquilla, Cartagena, Santa Marta, Bucaramanga, Pereira, Manizales, Cúcuta, Villavicencio, Armenia, Ibague, Pasto, Montería",
  Membership: false,
  NotificationDate: false,
  PlayStoreLink: "https://play.google.com/store/apps/details?id=com.treasapp.treas22",
  RiderWithDraw: false,
  SOAT_image_required: true,
  TwitterHandle: "https://twitter.com/treasappm",
  appName: "T+Plus",
  autoDispatch: true,
  bank_fields: false,
  bonus: 600,
  bookingFlow: 2,
  carApproval: false,
  carType_required: false,
  code: "COP",
  comissionCompany: 0.3,
  contact_email: "operaciones@treascorp.co",
  convert_to_mile: false,
  country: "Colombia",
  customMobileOTP: true,
  decimal: 0,
  disable_corp: false,
  disable_online: false,
  distanceIntermunicipal: 25,
  driverRadius: 5,
  driverThreshold: "0",
  driver_approval: true,
  emailLogin: true,
  horizontal_view: true,
  imageIdApproval: true,
  license_image_required: true,
  mapLanguage: "en",
  mobileLogin: false,
  negativeBalance: false,
  otp_secure: true,
  panic: "123",
  prepaid: false,
  realtime_drivers: true,
  restrictCountry: "US",
  showLiveRoute: false,
  socialLogin: false,
  swipe_symbol: false,
  symbol: "$",
  tajetadeprpiedad_image_required: true,
  term_required: true,
  useDistanceMatrix: false,
  versionWeb: "1.0.0",
  walletMoneyField: "96000,48000,36000,15000"
};

// Función para subir los datos a la colección y documento especificados
const uploadData = async () => {
  try {
    const docRef = db.collection('appConfig').doc('generalSettings');
    await docRef.set(appConfigData);
    console.log("Datos subidos exitosamente a Firestore.");
  } catch (error) {
    console.error("Error al subir los datos a Firestore:", error);
  }
};

uploadData();