# App Review Information — Notes (TmasPlus)

> Texto para pegar en **App Store Connect → App Review Information → Notes**.
> Lo que está entre `[[ ]]` lo tienes que completar tú antes de enviar.
> Está en inglés a propósito: es el idioma en que trabaja App Review.

---

Hello, and thank you for the review.

Below is the information requested under Guideline 2.1, in the same order as your message.

---

**1. Screen recording**

A full screen recording captured on a physical iPhone running the latest iOS is available here:

`[[ENLACE AL VIDEO — accesible sin login]]`

The recording starts by launching the app from the home screen and covers, in this order: account registration, email verification, login, every system permission prompt (location when-in-use, location always, notifications, camera and photo library), the complete passenger flow (address selection, vehicle and fare selection, immediate ride, scheduled reservation, live driver tracking, safety OTP, in-trip chat, trip completion and driver rating), the complete driver flow (receiving a request, accepting, navigating, confirming arrival, ending the trip and collecting payment), the driver membership screen and its payment flow, the complaint/report flow, and finally in-app account deletion.

Because TmasPlus connects two different people in real time (a passenger and a driver), the recording shows both sides of the same trip so the full core feature is visible end to end.

---

**2. Devices and operating systems tested**

The app was tested on physical devices before submission:

- `[[MODELO iPhone 1]]` — iOS `[[versión]]`
- `[[MODELO iPhone 2]]` — iOS `[[versión]]`

The app is iPhone-only (`supportsTablet: false`) and portrait-only.

---

**3. What the app does, who it is for, and the value it provides**

TmasPlus is an urban mobility platform that connects passengers with verified drivers in Colombia.

**The problem it solves.** In the cities where we operate, passengers book rides informally — by phone or by hailing on the street — with no fare known in advance, no record of who is driving, and no way for a family member to follow the trip. Drivers, on the other side, depend on radio dispatch or word of mouth and have no reliable stream of requests.

**How it works.** A passenger sets a pickup and drop-off point on the map, sees the available vehicle categories with the fare calculated in advance, and requests either an immediate ride or a scheduled reservation. Nearby drivers receive the request and one accepts it. From that moment the passenger follows the vehicle live on the map, can chat with or call the driver, and can share the trip with a safety contact. A one-time security code (OTP) confirms the passenger is boarding the correct vehicle. When the trip ends, the fare is settled and the passenger rates the driver.

**Who it is for.** Everyday passengers in Colombian cities who need urban transport, and professional drivers affiliated with the platform who work through it. There is also a corporate profile for companies that manage employee travel.

**Value.** Fare known before booking, a verified and identified driver, real-time tracking, trip sharing with a safety contact, OTP boarding verification, and a complete trip history for both sides.

---

**4. How to set up and access the main features**

The app has two account types. Credentials for both are below and also in the demo account fields of App Store Connect.

**Passenger account**
- Email: `[[EMAIL CLIENTE]]`
- Password: `[[PASSWORD CLIENTE]]`

**Driver account** (already approved, with documents and vehicle validated)
- Email: `[[EMAIL CONDUCTOR]]`
- Password: `[[PASSWORD CONDUCTOR]]`

Both accounts already have their email verified, so no confirmation step is needed to sign in.

**To reach the main features as a passenger:**
1. Sign in with the passenger account.
2. Accept the location permission when prompted — the map and fare calculation depend on it.
3. On the home map, set the pickup point and then the destination.
4. Choose a vehicle category to see the estimated fare.
5. Tap to request an immediate ride, or switch to the reservation tab to schedule one for a later date and time.
6. Once a driver accepts, the trip screen shows the vehicle moving in real time, the driver's details, the chat, the call button, the OTP, and the option to share the trip with a safety contact.
7. When the trip ends, the app opens the rating screen.
8. Account deletion is in Profile → *Eliminar cuenta* (Delete account).

**To reach the main features as a driver:**
1. Sign in with the driver account.
2. Accept the location permission, choosing **Always**, and accept notifications — a driver cannot receive or serve requests without them.
3. Toggle the availability switch to go online.
4. Incoming requests appear on screen with an audible alert. Accept one to start the trip flow: navigate to pickup, confirm arrival, validate the passenger's OTP, drive, end the trip and register the payment.
5. Earnings, membership and kilometer packages are under the wallet section.

**Important note about testing.** A trip requires a real passenger and a real driver connected at the same time. If the reviewer signs in with only one of the two accounts, no counterpart will exist and the flow will appear to stall — this is the expected behavior of a two-sided marketplace, not a bug. The screen recording in point 1 shows both sides simultaneously. If it helps, we can coordinate a time window in which one of our drivers is online and available to take the reviewer's request; just let us know in this thread.

---

**5. External services used to deliver core functionality**

| Service | Purpose in the app |
|---|---|
| **Supabase** | Authentication, PostgreSQL database, file storage (driver documents and profile photos), realtime subscriptions and server-side edge functions. Primary backend. |
| **Firebase Realtime Database** | Live synchronization of vehicle position and operational settings during a trip. |
| **Google Maps Platform** | Map rendering (Maps SDK for iOS), address autocomplete (Places API) and route/ETA calculation (Directions API). |
| **Mapbox** | Map and route rendering on the trip and tracking screens. |
| **Expo push notifications (Expo Application Services)** | Delivery of push notifications: new ride requests for drivers, driver-assigned and trip-status alerts for passengers. |
| **EAS Update (Expo)** | Over-the-air delivery of JavaScript bug fixes. It is never used to change the app's purpose, add features outside the reviewed scope, or alter the native binary. |
| **Daviplata** (mobile wallet operated by Banco Davivienda, Colombia) | Payment method used by drivers to pay their platform membership and kilometer packages. See the note below. |

The app does **not** use any advertising SDK, any third-party analytics or tracking SDK, or any AI service. Phone calls between passenger and driver are placed through the native iOS dialer (`telprompt:`), not through a third-party VoIP provider.

**Note on payments (Guideline 3.1).** Passenger rides are paid in cash or by wallet directly to the driver at the end of the trip — a physical, real-world transport service consumed outside the app, which under Guideline 3.1.3(e) does not use in-app purchase. The membership and kilometer packages are **not** sold to passengers and do not unlock any digital content or feature inside the app: they are a business fee paid by professional drivers for the right to operate on the platform and receive dispatch, equivalent to a commercial affiliation fee. `[[REVISAR: confirma que esta descripción es exacta antes de enviar]]`

---

**6. Regional differences**

The app functions consistently for all users. TmasPlus currently operates only in Colombia: fares are shown in Colombian pesos (COP) and the available payment methods are the ones used in that market. There are no features, content or behaviors that are enabled or disabled based on the user's region — the app behaves identically everywhere it can be downloaded. `[[Si limitas la disponibilidad de la app a Colombia en ASC, añade aquí: "App Store availability is limited to Colombia."]]`

---

**7. Regulated industry and authorization**

Passenger ground transport is a regulated activity in Colombia. `[[Adjunta aquí: razón social y NIT de la empresa, documento de habilitación / registro ante la autoridad de transporte competente, y si aplica el convenio con la empresa de transporte habilitada]]`

In addition, every driver on the platform is manually verified before being allowed to operate: they must upload their national ID, driver's license, vehicle registration and insurance documents, which are reviewed and approved one by one by our operations team. A driver whose documents are not approved cannot go online or receive ride requests.

---

**Additional context on permissions**

- **Background location** is requested only from drivers, and only to keep the vehicle's position updated on the passenger's map while a trip is in progress. Tracking stops when the trip ends or when the driver goes offline. Passengers are never tracked in the background.
- **Camera and photo library** are used for the profile picture and, for drivers, to upload the verification documents described in point 7.
- The app does **not** request App Tracking Transparency, because it performs no tracking and serves no advertising.

We remain available in this thread for anything else you need.

Thank you,
`[[TU NOMBRE]]` — TmasPlus
