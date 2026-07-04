[**TmasPlus — Referencia de código**](../../../../README.md)

***

[TmasPlus — Referencia de código](../../../../README.md) / [common/store/bookingsSlice](../README.md) / mapSupabaseBooking

# Function: mapSupabaseBooking()

> **mapSupabaseBooking**(`row`): `object`

Defined in: [common/store/bookingsSlice.ts:33](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/common/store/bookingsSlice.ts#L33)

Convierte una fila de Supabase bookings al formato que usa Redux (compatible con legacy).

## Parameters

### row

`any`

## Returns

`object`

### id

> **id**: `any` = `row.id`

### status

> **status**: `any` = `row.status`

### customer

> **customer**: `any` = `row.customer`

### customer\_name

> **customer\_name**: `any` = `row.customer_name`

### customer\_contact

> **customer\_contact**: `any` = `row.customer_contact`

### customer\_city

> **customer\_city**: `any` = `row.customer_city`

### customer\_token

> **customer\_token**: `any` = `row.customer_token`

### customer\_status

> **customer\_status**: `any` = `row.customer_status`

### driver

> **driver**: `any` = `row.driver`

### driver\_name

> **driver\_name**: `any` = `row.driver_name`

### driver\_contact

> **driver\_contact**: `any` = `row.driver_contact`

### driver\_token

> **driver\_token**: `any` = `row.driver_token`

### driver\_status

> **driver\_status**: `any` = `row.driver_status`

### driver\_image

> **driver\_image**: `any` = `row.driver_image`

### driver\_arrived\_time

> **driver\_arrived\_time**: `any` = `row.driver_arrived_time`

### pickup

> **pickup**: `object`

#### pickup.lat

> **lat**: `any` = `row.pickup_lat`

#### pickup.lng

> **lng**: `any` = `row.pickup_lng`

#### pickup.add

> **add**: `any` = `row.pickup_address`

### drop

> **drop**: `object`

#### drop.lat

> **lat**: `any` = `row.drop_lat`

#### drop.lng

> **lng**: `any` = `row.drop_lng`

#### drop.add

> **add**: `any` = `row.drop_address`

### pickupAddress

> **pickupAddress**: `any` = `row.pickup_address`

### dropAddress

> **dropAddress**: `any` = `row.drop_address`

### carType

> **carType**: `any` = `row.car_type`

### car\_image

> **car\_image**: `any` = `row.car_image`

### vehicle\_number

> **vehicle\_number**: `any` = `row.vehicle_number`

### vehicleNumber

> **vehicleNumber**: `any` = `row.vehicle_number`

### vehicleModel

> **vehicleModel**: `any` = `row.car_model`

### vehicleColor

> **vehicleColor**: `any` = `row.vehicle_color`

### vehicleMake

> **vehicleMake**: `any` = `row.vehicle_make`

### plate\_number

> **plate\_number**: `any` = `row.plate_number`

### estimate

> **estimate**: `any` = `row.estimate`

### trip\_cost

> **trip\_cost**: `any` = `row.trip_cost`

### convenience\_fees

> **convenience\_fees**: `any` = `row.convenience_fees`

### discount

> **discount**: `any` = `row.discount`

### driver\_share

> **driver\_share**: `any` = `row.driver_share`

### payment\_mode

> **payment\_mode**: `any` = `row.payment_mode`

### reference

> **reference**: `any` = `row.reference`

### distance

> **distance**: `any` = `row.distance`

### estimateTime

> **estimateTime**: `any` = `row.duration`

### tripType

> **tripType**: `any` = `row.trip_type`

### tripUrban

> **tripUrban**: `any` = `row.trip_urban`

### otp

> **otp**: `any` = `row.otp`

### coords

> **coords**: `any` = `row.coords`

### startTime

> **startTime**: `any` = `row.trip_start_time`

### endTime

> **endTime**: `any` = `row.trip_end_time`

### total\_trip\_time

> **total\_trip\_time**: `any` = `row.total_trip_time`

### observations

> **observations**: `any` = `row.observations`

### requestedDrivers

> **requestedDrivers**: `any`

### driverEstimates

> **driverEstimates**: `any`

### booking\_date

> **booking\_date**: `any` = `row.booking_date`

### created\_at

> **created\_at**: `any` = `row.created_at`
