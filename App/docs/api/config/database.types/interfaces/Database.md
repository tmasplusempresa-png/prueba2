[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [config/database.types](../README.md) / Database

# Interface: Database

Defined in: [config/database.types.ts:11](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/config/database.types.ts#L11)

## Properties

### public

> **public**: `object`

Defined in: [config/database.types.ts:12](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/config/database.types.ts#L12)

#### Tables

> **Tables**: `object`

##### Tables.users

> **users**: `object`

##### Tables.users.Row

> **Row**: `object`

##### Tables.users.Row.id

> **id**: `string`

##### Tables.users.Row.auth\_id

> **auth\_id**: `string` \| `null`

##### Tables.users.Row.email

> **email**: `string`

##### Tables.users.Row.first\_name

> **first\_name**: `string`

##### Tables.users.Row.last\_name

> **last\_name**: `string`

##### Tables.users.Row.mobile

> **mobile**: `string` \| `null`

##### Tables.users.Row.user\_type

> **user\_type**: `string`

##### Tables.users.Row.wallet\_balance

> **wallet\_balance**: `number`

##### Tables.users.Row.location

> **location**: [`Json`](../type-aliases/Json.md)

##### Tables.users.Row.profile\_image

> **profile\_image**: `string` \| `null`

##### Tables.users.Row.rating

> **rating**: `number`

##### Tables.users.Row.total\_rides

> **total\_rides**: `number`

##### Tables.users.Row.is\_verified

> **is\_verified**: `boolean`

##### Tables.users.Row.approved

> **approved**: `boolean`

##### Tables.users.Row.blocked

> **blocked**: `boolean`

##### Tables.users.Row.referral\_id

> **referral\_id**: `string` \| `null`

##### Tables.users.Row.referred\_by\_code

> **referred\_by\_code**: `string` \| `null`

##### Tables.users.Row.document\_type

> **document\_type**: `string` \| `null`

##### Tables.users.Row.document\_number

> **document\_number**: `string` \| `null`

##### Tables.users.Row.city

> **city**: `string` \| `null`

##### Tables.users.Row.driver\_active\_status

> **driver\_active\_status**: `boolean`

##### Tables.users.Row.license\_number

> **license\_number**: `string` \| `null`

##### Tables.users.Row.license\_image

> **license\_image**: `string` \| `null`

##### Tables.users.Row.license\_image\_back

> **license\_image\_back**: `string` \| `null`

##### Tables.users.Row.soat\_image

> **soat\_image**: `string` \| `null`

##### Tables.users.Row.card\_prop\_image

> **card\_prop\_image**: `string` \| `null`

##### Tables.users.Row.card\_prop\_image\_bk

> **card\_prop\_image\_bk**: `string` \| `null`

##### Tables.users.Row.verify\_id\_image

> **verify\_id\_image**: `string` \| `null`

##### Tables.users.Row.verify\_id\_image\_bk

> **verify\_id\_image\_bk**: `string` \| `null`

##### Tables.users.Row.push\_token

> **push\_token**: `string` \| `null`

##### Tables.users.Row.user\_platform

> **user\_platform**: `string` \| `null`

##### Tables.users.Row.created\_at

> **created\_at**: `string`

##### Tables.users.Row.updated\_at

> **updated\_at**: `string`

##### Tables.users.Insert

> **Insert**: `object`

##### Tables.users.Insert.id?

> `optional` **id?**: `string`

##### Tables.users.Insert.auth\_id?

> `optional` **auth\_id?**: `string` \| `null`

##### Tables.users.Insert.email

> **email**: `string`

##### Tables.users.Insert.first\_name

> **first\_name**: `string`

##### Tables.users.Insert.last\_name

> **last\_name**: `string`

##### Tables.users.Insert.mobile?

> `optional` **mobile?**: `string` \| `null`

##### Tables.users.Insert.user\_type?

> `optional` **user\_type?**: `string`

##### Tables.users.Insert.wallet\_balance?

> `optional` **wallet\_balance?**: `number`

##### Tables.users.Insert.location?

> `optional` **location?**: [`Json`](../type-aliases/Json.md)

##### Tables.users.Insert.profile\_image?

> `optional` **profile\_image?**: `string` \| `null`

##### Tables.users.Insert.rating?

> `optional` **rating?**: `number`

##### Tables.users.Insert.total\_rides?

> `optional` **total\_rides?**: `number`

##### Tables.users.Insert.is\_verified?

> `optional` **is\_verified?**: `boolean`

##### Tables.users.Insert.approved?

> `optional` **approved?**: `boolean`

##### Tables.users.Insert.blocked?

> `optional` **blocked?**: `boolean`

##### Tables.users.Insert.referral\_id?

> `optional` **referral\_id?**: `string` \| `null`

##### Tables.users.Insert.referred\_by\_code?

> `optional` **referred\_by\_code?**: `string` \| `null`

##### Tables.users.Insert.document\_type?

> `optional` **document\_type?**: `string` \| `null`

##### Tables.users.Insert.document\_number?

> `optional` **document\_number?**: `string` \| `null`

##### Tables.users.Insert.city?

> `optional` **city?**: `string` \| `null`

##### Tables.users.Insert.driver\_active\_status?

> `optional` **driver\_active\_status?**: `boolean`

##### Tables.users.Insert.license\_number?

> `optional` **license\_number?**: `string` \| `null`

##### Tables.users.Insert.license\_image?

> `optional` **license\_image?**: `string` \| `null`

##### Tables.users.Insert.license\_image\_back?

> `optional` **license\_image\_back?**: `string` \| `null`

##### Tables.users.Insert.soat\_image?

> `optional` **soat\_image?**: `string` \| `null`

##### Tables.users.Insert.card\_prop\_image?

> `optional` **card\_prop\_image?**: `string` \| `null`

##### Tables.users.Insert.card\_prop\_image\_bk?

> `optional` **card\_prop\_image\_bk?**: `string` \| `null`

##### Tables.users.Insert.verify\_id\_image?

> `optional` **verify\_id\_image?**: `string` \| `null`

##### Tables.users.Insert.verify\_id\_image\_bk?

> `optional` **verify\_id\_image\_bk?**: `string` \| `null`

##### Tables.users.Insert.push\_token?

> `optional` **push\_token?**: `string` \| `null`

##### Tables.users.Insert.user\_platform?

> `optional` **user\_platform?**: `string` \| `null`

##### Tables.users.Insert.created\_at?

> `optional` **created\_at?**: `string`

##### Tables.users.Insert.updated\_at?

> `optional` **updated\_at?**: `string`

##### Tables.users.Update

> **Update**: `object`

##### Tables.users.Update.id?

> `optional` **id?**: `string`

##### Tables.users.Update.auth\_id?

> `optional` **auth\_id?**: `string` \| `null`

##### Tables.users.Update.email?

> `optional` **email?**: `string`

##### Tables.users.Update.first\_name?

> `optional` **first\_name?**: `string`

##### Tables.users.Update.last\_name?

> `optional` **last\_name?**: `string`

##### Tables.users.Update.mobile?

> `optional` **mobile?**: `string` \| `null`

##### Tables.users.Update.user\_type?

> `optional` **user\_type?**: `string`

##### Tables.users.Update.wallet\_balance?

> `optional` **wallet\_balance?**: `number`

##### Tables.users.Update.location?

> `optional` **location?**: [`Json`](../type-aliases/Json.md)

##### Tables.users.Update.profile\_image?

> `optional` **profile\_image?**: `string` \| `null`

##### Tables.users.Update.rating?

> `optional` **rating?**: `number`

##### Tables.users.Update.total\_rides?

> `optional` **total\_rides?**: `number`

##### Tables.users.Update.is\_verified?

> `optional` **is\_verified?**: `boolean`

##### Tables.users.Update.approved?

> `optional` **approved?**: `boolean`

##### Tables.users.Update.blocked?

> `optional` **blocked?**: `boolean`

##### Tables.users.Update.referral\_id?

> `optional` **referral\_id?**: `string` \| `null`

##### Tables.users.Update.referred\_by\_code?

> `optional` **referred\_by\_code?**: `string` \| `null`

##### Tables.users.Update.document\_type?

> `optional` **document\_type?**: `string` \| `null`

##### Tables.users.Update.document\_number?

> `optional` **document\_number?**: `string` \| `null`

##### Tables.users.Update.city?

> `optional` **city?**: `string` \| `null`

##### Tables.users.Update.driver\_active\_status?

> `optional` **driver\_active\_status?**: `boolean`

##### Tables.users.Update.license\_number?

> `optional` **license\_number?**: `string` \| `null`

##### Tables.users.Update.license\_image?

> `optional` **license\_image?**: `string` \| `null`

##### Tables.users.Update.license\_image\_back?

> `optional` **license\_image\_back?**: `string` \| `null`

##### Tables.users.Update.soat\_image?

> `optional` **soat\_image?**: `string` \| `null`

##### Tables.users.Update.card\_prop\_image?

> `optional` **card\_prop\_image?**: `string` \| `null`

##### Tables.users.Update.card\_prop\_image\_bk?

> `optional` **card\_prop\_image\_bk?**: `string` \| `null`

##### Tables.users.Update.verify\_id\_image?

> `optional` **verify\_id\_image?**: `string` \| `null`

##### Tables.users.Update.verify\_id\_image\_bk?

> `optional` **verify\_id\_image\_bk?**: `string` \| `null`

##### Tables.users.Update.push\_token?

> `optional` **push\_token?**: `string` \| `null`

##### Tables.users.Update.user\_platform?

> `optional` **user\_platform?**: `string` \| `null`

##### Tables.users.Update.created\_at?

> `optional` **created\_at?**: `string`

##### Tables.users.Update.updated\_at?

> `optional` **updated\_at?**: `string`

##### Tables.cars

> **cars**: `object`

##### Tables.cars.Row

> **Row**: `object`

##### Tables.cars.Row.id

> **id**: `string`

##### Tables.cars.Row.driver\_id

> **driver\_id**: `string` \| `null`

##### Tables.cars.Row.make

> **make**: `string`

##### Tables.cars.Row.model

> **model**: `string`

##### Tables.cars.Row.year

> **year**: `number` \| `null`

##### Tables.cars.Row.color

> **color**: `string` \| `null`

##### Tables.cars.Row.plate

> **plate**: `string`

##### Tables.cars.Row.car\_image

> **car\_image**: `string` \| `null`

##### Tables.cars.Row.vehicle\_number

> **vehicle\_number**: `string` \| `null`

##### Tables.cars.Row.vehicle\_model

> **vehicle\_model**: `string` \| `null`

##### Tables.cars.Row.vehicle\_make

> **vehicle\_make**: `string` \| `null`

##### Tables.cars.Row.vehicle\_color

> **vehicle\_color**: `string` \| `null`

##### Tables.cars.Row.fuel\_type

> **fuel\_type**: `string`

##### Tables.cars.Row.transmission

> **transmission**: `string`

##### Tables.cars.Row.capacity

> **capacity**: `number`

##### Tables.cars.Row.is\_active

> **is\_active**: `boolean`

##### Tables.cars.Row.features

> **features**: [`Json`](../type-aliases/Json.md)

##### Tables.cars.Row.created\_at

> **created\_at**: `string`

##### Tables.cars.Row.updated\_at

> **updated\_at**: `string`

##### Tables.cars.Insert

> **Insert**: `object`

##### Tables.cars.Insert.id?

> `optional` **id?**: `string`

##### Tables.cars.Insert.driver\_id?

> `optional` **driver\_id?**: `string` \| `null`

##### Tables.cars.Insert.make

> **make**: `string`

##### Tables.cars.Insert.model

> **model**: `string`

##### Tables.cars.Insert.year?

> `optional` **year?**: `number` \| `null`

##### Tables.cars.Insert.color?

> `optional` **color?**: `string` \| `null`

##### Tables.cars.Insert.plate

> **plate**: `string`

##### Tables.cars.Insert.car\_image?

> `optional` **car\_image?**: `string` \| `null`

##### Tables.cars.Insert.vehicle\_number?

> `optional` **vehicle\_number?**: `string` \| `null`

##### Tables.cars.Insert.vehicle\_model?

> `optional` **vehicle\_model?**: `string` \| `null`

##### Tables.cars.Insert.vehicle\_make?

> `optional` **vehicle\_make?**: `string` \| `null`

##### Tables.cars.Insert.vehicle\_color?

> `optional` **vehicle\_color?**: `string` \| `null`

##### Tables.cars.Insert.fuel\_type?

> `optional` **fuel\_type?**: `string`

##### Tables.cars.Insert.transmission?

> `optional` **transmission?**: `string`

##### Tables.cars.Insert.capacity?

> `optional` **capacity?**: `number`

##### Tables.cars.Insert.is\_active?

> `optional` **is\_active?**: `boolean`

##### Tables.cars.Insert.features?

> `optional` **features?**: [`Json`](../type-aliases/Json.md)

##### Tables.cars.Insert.created\_at?

> `optional` **created\_at?**: `string`

##### Tables.cars.Insert.updated\_at?

> `optional` **updated\_at?**: `string`

##### Tables.cars.Update

> **Update**: `object`

##### Tables.cars.Update.id?

> `optional` **id?**: `string`

##### Tables.cars.Update.driver\_id?

> `optional` **driver\_id?**: `string` \| `null`

##### Tables.cars.Update.make?

> `optional` **make?**: `string`

##### Tables.cars.Update.model?

> `optional` **model?**: `string`

##### Tables.cars.Update.year?

> `optional` **year?**: `number` \| `null`

##### Tables.cars.Update.color?

> `optional` **color?**: `string` \| `null`

##### Tables.cars.Update.plate?

> `optional` **plate?**: `string`

##### Tables.cars.Update.car\_image?

> `optional` **car\_image?**: `string` \| `null`

##### Tables.cars.Update.vehicle\_number?

> `optional` **vehicle\_number?**: `string` \| `null`

##### Tables.cars.Update.vehicle\_model?

> `optional` **vehicle\_model?**: `string` \| `null`

##### Tables.cars.Update.vehicle\_make?

> `optional` **vehicle\_make?**: `string` \| `null`

##### Tables.cars.Update.vehicle\_color?

> `optional` **vehicle\_color?**: `string` \| `null`

##### Tables.cars.Update.fuel\_type?

> `optional` **fuel\_type?**: `string`

##### Tables.cars.Update.transmission?

> `optional` **transmission?**: `string`

##### Tables.cars.Update.capacity?

> `optional` **capacity?**: `number`

##### Tables.cars.Update.is\_active?

> `optional` **is\_active?**: `boolean`

##### Tables.cars.Update.features?

> `optional` **features?**: [`Json`](../type-aliases/Json.md)

##### Tables.cars.Update.created\_at?

> `optional` **created\_at?**: `string`

##### Tables.cars.Update.updated\_at?

> `optional` **updated\_at?**: `string`

##### Tables.car\_types

> **car\_types**: `object`

##### Tables.car\_types.Row

> **Row**: `object`

##### Tables.car\_types.Row.id

> **id**: `string`

##### Tables.car\_types.Row.name

> **name**: `string`

##### Tables.car\_types.Row.description

> **description**: `string` \| `null`

##### Tables.car\_types.Row.base\_price

> **base\_price**: `number`

##### Tables.car\_types.Row.price\_per\_km

> **price\_per\_km**: `number`

##### Tables.car\_types.Row.image

> **image**: `string` \| `null`

##### Tables.car\_types.Row.capacity

> **capacity**: `number`

##### Tables.car\_types.Row.is\_active

> **is\_active**: `boolean`

##### Tables.car\_types.Row.created\_at

> **created\_at**: `string`

##### Tables.car\_types.Row.updated\_at

> **updated\_at**: `string`

##### Tables.car\_types.Row.base\_price\_inter

> **base\_price\_inter**: `number`

##### Tables.car\_types.Row.price\_per\_km\_inter

> **price\_per\_km\_inter**: `number`

##### Tables.car\_types.Row.rate\_per\_hour

> **rate\_per\_hour**: `number`

##### Tables.car\_types.Row.rate\_per\_hour\_inter

> **rate\_per\_hour\_inter**: `number`

##### Tables.car\_types.Row.valor\_hora

> **valor\_hora**: `number`

##### Tables.car\_types.Row.min\_fare

> **min\_fare**: `number`

##### Tables.car\_types.Row.min\_fare\_inter

> **min\_fare\_inter**: `number`

##### Tables.car\_types.Row.delta\_aeropuerto

> **delta\_aeropuerto**: `number`

##### Tables.car\_types.Row.delta\_aeropuerto\_prog

> **delta\_aeropuerto\_prog**: `number`

##### Tables.car\_types.Row.convenience\_fee

> **convenience\_fee**: `number`

##### Tables.car\_types.Row.convenience\_fee\_type

> **convenience\_fee\_type**: `string`

##### Tables.car\_types.Row.umbral\_intermunicipal\_km

> **umbral\_intermunicipal\_km**: `number`

##### Tables.car\_types.Insert

> **Insert**: `object`

##### Tables.car\_types.Insert.id?

> `optional` **id?**: `string`

##### Tables.car\_types.Insert.name

> **name**: `string`

##### Tables.car\_types.Insert.description?

> `optional` **description?**: `string` \| `null`

##### Tables.car\_types.Insert.base\_price

> **base\_price**: `number`

##### Tables.car\_types.Insert.price\_per\_km

> **price\_per\_km**: `number`

##### Tables.car\_types.Insert.image?

> `optional` **image?**: `string` \| `null`

##### Tables.car\_types.Insert.capacity?

> `optional` **capacity?**: `number`

##### Tables.car\_types.Insert.is\_active?

> `optional` **is\_active?**: `boolean`

##### Tables.car\_types.Insert.created\_at?

> `optional` **created\_at?**: `string`

##### Tables.car\_types.Insert.updated\_at?

> `optional` **updated\_at?**: `string`

##### Tables.car\_types.Insert.base\_price\_inter?

> `optional` **base\_price\_inter?**: `number`

##### Tables.car\_types.Insert.price\_per\_km\_inter?

> `optional` **price\_per\_km\_inter?**: `number`

##### Tables.car\_types.Insert.rate\_per\_hour?

> `optional` **rate\_per\_hour?**: `number`

##### Tables.car\_types.Insert.rate\_per\_hour\_inter?

> `optional` **rate\_per\_hour\_inter?**: `number`

##### Tables.car\_types.Insert.valor\_hora?

> `optional` **valor\_hora?**: `number`

##### Tables.car\_types.Insert.min\_fare?

> `optional` **min\_fare?**: `number`

##### Tables.car\_types.Insert.min\_fare\_inter?

> `optional` **min\_fare\_inter?**: `number`

##### Tables.car\_types.Insert.delta\_aeropuerto?

> `optional` **delta\_aeropuerto?**: `number`

##### Tables.car\_types.Insert.delta\_aeropuerto\_prog?

> `optional` **delta\_aeropuerto\_prog?**: `number`

##### Tables.car\_types.Insert.convenience\_fee?

> `optional` **convenience\_fee?**: `number`

##### Tables.car\_types.Insert.convenience\_fee\_type?

> `optional` **convenience\_fee\_type?**: `string`

##### Tables.car\_types.Insert.umbral\_intermunicipal\_km?

> `optional` **umbral\_intermunicipal\_km?**: `number`

##### Tables.car\_types.Update

> **Update**: `object`

##### Tables.car\_types.Update.id?

> `optional` **id?**: `string`

##### Tables.car\_types.Update.name?

> `optional` **name?**: `string`

##### Tables.car\_types.Update.description?

> `optional` **description?**: `string` \| `null`

##### Tables.car\_types.Update.base\_price?

> `optional` **base\_price?**: `number`

##### Tables.car\_types.Update.price\_per\_km?

> `optional` **price\_per\_km?**: `number`

##### Tables.car\_types.Update.image?

> `optional` **image?**: `string` \| `null`

##### Tables.car\_types.Update.capacity?

> `optional` **capacity?**: `number`

##### Tables.car\_types.Update.is\_active?

> `optional` **is\_active?**: `boolean`

##### Tables.car\_types.Update.created\_at?

> `optional` **created\_at?**: `string`

##### Tables.car\_types.Update.updated\_at?

> `optional` **updated\_at?**: `string`

##### Tables.car\_types.Update.base\_price\_inter?

> `optional` **base\_price\_inter?**: `number`

##### Tables.car\_types.Update.price\_per\_km\_inter?

> `optional` **price\_per\_km\_inter?**: `number`

##### Tables.car\_types.Update.rate\_per\_hour?

> `optional` **rate\_per\_hour?**: `number`

##### Tables.car\_types.Update.rate\_per\_hour\_inter?

> `optional` **rate\_per\_hour\_inter?**: `number`

##### Tables.car\_types.Update.valor\_hora?

> `optional` **valor\_hora?**: `number`

##### Tables.car\_types.Update.min\_fare?

> `optional` **min\_fare?**: `number`

##### Tables.car\_types.Update.min\_fare\_inter?

> `optional` **min\_fare\_inter?**: `number`

##### Tables.car\_types.Update.delta\_aeropuerto?

> `optional` **delta\_aeropuerto?**: `number`

##### Tables.car\_types.Update.delta\_aeropuerto\_prog?

> `optional` **delta\_aeropuerto\_prog?**: `number`

##### Tables.car\_types.Update.convenience\_fee?

> `optional` **convenience\_fee?**: `number`

##### Tables.car\_types.Update.convenience\_fee\_type?

> `optional` **convenience\_fee\_type?**: `string`

##### Tables.car\_types.Update.umbral\_intermunicipal\_km?

> `optional` **umbral\_intermunicipal\_km?**: `number`

##### Tables.bookings

> **bookings**: `object`

##### Tables.bookings.Row

> **Row**: `object`

##### Tables.bookings.Row.id

> **id**: `string`

##### Tables.bookings.Row.customer\_id

> **customer\_id**: `string` \| `null`

##### Tables.bookings.Row.driver\_id

> **driver\_id**: `string` \| `null`

##### Tables.bookings.Row.car\_type\_id

> **car\_type\_id**: `string` \| `null`

##### Tables.bookings.Row.car\_id

> **car\_id**: `string` \| `null`

##### Tables.bookings.Row.status

> **status**: `string`

##### Tables.bookings.Row.pickup\_location

> **pickup\_location**: [`Json`](../type-aliases/Json.md)

##### Tables.bookings.Row.destination\_location

> **destination\_location**: [`Json`](../type-aliases/Json.md)

##### Tables.bookings.Row.drop\_location

> **drop\_location**: [`Json`](../type-aliases/Json.md)

##### Tables.bookings.Row.distance

> **distance**: `number` \| `null`

##### Tables.bookings.Row.duration

> **duration**: `number` \| `null`

##### Tables.bookings.Row.price

> **price**: `number`

##### Tables.bookings.Row.total\_trip\_time

> **total\_trip\_time**: `number` \| `null`

##### Tables.bookings.Row.trip\_start\_time

> **trip\_start\_time**: `string` \| `null`

##### Tables.bookings.Row.trip\_end\_time

> **trip\_end\_time**: `string` \| `null`

##### Tables.bookings.Row.driver\_arrived\_time

> **driver\_arrived\_time**: `string` \| `null`

##### Tables.bookings.Row.start\_time

> **start\_time**: `number` \| `null`

##### Tables.bookings.Row.end\_time

> **end\_time**: `number` \| `null`

##### Tables.bookings.Row.driver\_status

> **driver\_status**: `string` \| `null`

##### Tables.bookings.Row.customer\_status

> **customer\_status**: `string` \| `null`

##### Tables.bookings.Row.driver\_name

> **driver\_name**: `string` \| `null`

##### Tables.bookings.Row.driver\_image

> **driver\_image**: `string` \| `null`

##### Tables.bookings.Row.driver\_contact

> **driver\_contact**: `string` \| `null`

##### Tables.bookings.Row.driver\_rating

> **driver\_rating**: `number` \| `null`

##### Tables.bookings.Row.car\_image

> **car\_image**: `string` \| `null`

##### Tables.bookings.Row.car\_model

> **car\_model**: `string` \| `null`

##### Tables.bookings.Row.car\_color

> **car\_color**: `string` \| `null`

##### Tables.bookings.Row.plate\_number

> **plate\_number**: `string` \| `null`

##### Tables.bookings.Row.vehicle\_number

> **vehicle\_number**: `string` \| `null`

##### Tables.bookings.Row.vehicle\_model

> **vehicle\_model**: `string` \| `null`

##### Tables.bookings.Row.vehicle\_make

> **vehicle\_make**: `string` \| `null`

##### Tables.bookings.Row.vehicle\_color

> **vehicle\_color**: `string` \| `null`

##### Tables.bookings.Row.customer\_token

> **customer\_token**: `string` \| `null`

##### Tables.bookings.Row.driver\_token

> **driver\_token**: `string` \| `null`

##### Tables.bookings.Row.payment\_mode

> **payment\_mode**: `string`

##### Tables.bookings.Row.prepaid

> **prepaid**: `boolean`

##### Tables.bookings.Row.rating

> **rating**: `number` \| `null`

##### Tables.bookings.Row.review

> **review**: `string` \| `null`

##### Tables.bookings.Row.reason

> **reason**: `string` \| `null`

##### Tables.bookings.Row.cancelled\_by

> **cancelled\_by**: `string` \| `null`

##### Tables.bookings.Row.cancellation\_time

> **cancellation\_time**: `string` \| `null`

##### Tables.bookings.Row.cancelled\_at

> **cancelled\_at**: `number` \| `null`

##### Tables.bookings.Row.incident

> **incident**: [`Json`](../type-aliases/Json.md)

##### Tables.bookings.Row.customer\_city

> **customer\_city**: `string` \| `null`

##### Tables.bookings.Row.driver\_city

> **driver\_city**: `string` \| `null`

##### Tables.bookings.Row.reference

> **reference**: `string` \| `null`

##### Tables.bookings.Row.created\_at

> **created\_at**: `string`

##### Tables.bookings.Row.updated\_at

> **updated\_at**: `string`

##### Tables.bookings.Insert

> **Insert**: `object`

##### Tables.bookings.Insert.id?

> `optional` **id?**: `string`

##### Tables.bookings.Insert.customer\_id?

> `optional` **customer\_id?**: `string` \| `null`

##### Tables.bookings.Insert.driver\_id?

> `optional` **driver\_id?**: `string` \| `null`

##### Tables.bookings.Insert.car\_type\_id?

> `optional` **car\_type\_id?**: `string` \| `null`

##### Tables.bookings.Insert.car\_id?

> `optional` **car\_id?**: `string` \| `null`

##### Tables.bookings.Insert.status?

> `optional` **status?**: `string`

##### Tables.bookings.Insert.pickup\_location

> **pickup\_location**: [`Json`](../type-aliases/Json.md)

##### Tables.bookings.Insert.destination\_location

> **destination\_location**: [`Json`](../type-aliases/Json.md)

##### Tables.bookings.Insert.drop\_location?

> `optional` **drop\_location?**: [`Json`](../type-aliases/Json.md)

##### Tables.bookings.Insert.distance?

> `optional` **distance?**: `number` \| `null`

##### Tables.bookings.Insert.duration?

> `optional` **duration?**: `number` \| `null`

##### Tables.bookings.Insert.price

> **price**: `number`

##### Tables.bookings.Insert.total\_trip\_time?

> `optional` **total\_trip\_time?**: `number` \| `null`

##### Tables.bookings.Insert.trip\_start\_time?

> `optional` **trip\_start\_time?**: `string` \| `null`

##### Tables.bookings.Insert.trip\_end\_time?

> `optional` **trip\_end\_time?**: `string` \| `null`

##### Tables.bookings.Insert.driver\_arrived\_time?

> `optional` **driver\_arrived\_time?**: `string` \| `null`

##### Tables.bookings.Insert.start\_time?

> `optional` **start\_time?**: `number` \| `null`

##### Tables.bookings.Insert.end\_time?

> `optional` **end\_time?**: `number` \| `null`

##### Tables.bookings.Insert.driver\_status?

> `optional` **driver\_status?**: `string` \| `null`

##### Tables.bookings.Insert.customer\_status?

> `optional` **customer\_status?**: `string` \| `null`

##### Tables.bookings.Insert.driver\_name?

> `optional` **driver\_name?**: `string` \| `null`

##### Tables.bookings.Insert.driver\_image?

> `optional` **driver\_image?**: `string` \| `null`

##### Tables.bookings.Insert.driver\_contact?

> `optional` **driver\_contact?**: `string` \| `null`

##### Tables.bookings.Insert.driver\_rating?

> `optional` **driver\_rating?**: `number` \| `null`

##### Tables.bookings.Insert.car\_image?

> `optional` **car\_image?**: `string` \| `null`

##### Tables.bookings.Insert.car\_model?

> `optional` **car\_model?**: `string` \| `null`

##### Tables.bookings.Insert.car\_color?

> `optional` **car\_color?**: `string` \| `null`

##### Tables.bookings.Insert.plate\_number?

> `optional` **plate\_number?**: `string` \| `null`

##### Tables.bookings.Insert.vehicle\_number?

> `optional` **vehicle\_number?**: `string` \| `null`

##### Tables.bookings.Insert.vehicle\_model?

> `optional` **vehicle\_model?**: `string` \| `null`

##### Tables.bookings.Insert.vehicle\_make?

> `optional` **vehicle\_make?**: `string` \| `null`

##### Tables.bookings.Insert.vehicle\_color?

> `optional` **vehicle\_color?**: `string` \| `null`

##### Tables.bookings.Insert.customer\_token?

> `optional` **customer\_token?**: `string` \| `null`

##### Tables.bookings.Insert.driver\_token?

> `optional` **driver\_token?**: `string` \| `null`

##### Tables.bookings.Insert.payment\_mode?

> `optional` **payment\_mode?**: `string`

##### Tables.bookings.Insert.prepaid?

> `optional` **prepaid?**: `boolean`

##### Tables.bookings.Insert.rating?

> `optional` **rating?**: `number` \| `null`

##### Tables.bookings.Insert.review?

> `optional` **review?**: `string` \| `null`

##### Tables.bookings.Insert.reason?

> `optional` **reason?**: `string` \| `null`

##### Tables.bookings.Insert.cancelled\_by?

> `optional` **cancelled\_by?**: `string` \| `null`

##### Tables.bookings.Insert.cancellation\_time?

> `optional` **cancellation\_time?**: `string` \| `null`

##### Tables.bookings.Insert.cancelled\_at?

> `optional` **cancelled\_at?**: `number` \| `null`

##### Tables.bookings.Insert.incident?

> `optional` **incident?**: [`Json`](../type-aliases/Json.md)

##### Tables.bookings.Insert.customer\_city?

> `optional` **customer\_city?**: `string` \| `null`

##### Tables.bookings.Insert.driver\_city?

> `optional` **driver\_city?**: `string` \| `null`

##### Tables.bookings.Insert.reference?

> `optional` **reference?**: `string` \| `null`

##### Tables.bookings.Insert.created\_at?

> `optional` **created\_at?**: `string`

##### Tables.bookings.Insert.updated\_at?

> `optional` **updated\_at?**: `string`

##### Tables.bookings.Update

> **Update**: `object`

##### Tables.bookings.Update.id?

> `optional` **id?**: `string`

##### Tables.bookings.Update.customer\_id?

> `optional` **customer\_id?**: `string` \| `null`

##### Tables.bookings.Update.driver\_id?

> `optional` **driver\_id?**: `string` \| `null`

##### Tables.bookings.Update.car\_type\_id?

> `optional` **car\_type\_id?**: `string` \| `null`

##### Tables.bookings.Update.car\_id?

> `optional` **car\_id?**: `string` \| `null`

##### Tables.bookings.Update.status?

> `optional` **status?**: `string`

##### Tables.bookings.Update.pickup\_location?

> `optional` **pickup\_location?**: [`Json`](../type-aliases/Json.md)

##### Tables.bookings.Update.destination\_location?

> `optional` **destination\_location?**: [`Json`](../type-aliases/Json.md)

##### Tables.bookings.Update.drop\_location?

> `optional` **drop\_location?**: [`Json`](../type-aliases/Json.md)

##### Tables.bookings.Update.distance?

> `optional` **distance?**: `number` \| `null`

##### Tables.bookings.Update.duration?

> `optional` **duration?**: `number` \| `null`

##### Tables.bookings.Update.price?

> `optional` **price?**: `number`

##### Tables.bookings.Update.total\_trip\_time?

> `optional` **total\_trip\_time?**: `number` \| `null`

##### Tables.bookings.Update.trip\_start\_time?

> `optional` **trip\_start\_time?**: `string` \| `null`

##### Tables.bookings.Update.trip\_end\_time?

> `optional` **trip\_end\_time?**: `string` \| `null`

##### Tables.bookings.Update.driver\_arrived\_time?

> `optional` **driver\_arrived\_time?**: `string` \| `null`

##### Tables.bookings.Update.start\_time?

> `optional` **start\_time?**: `number` \| `null`

##### Tables.bookings.Update.end\_time?

> `optional` **end\_time?**: `number` \| `null`

##### Tables.bookings.Update.driver\_status?

> `optional` **driver\_status?**: `string` \| `null`

##### Tables.bookings.Update.customer\_status?

> `optional` **customer\_status?**: `string` \| `null`

##### Tables.bookings.Update.driver\_name?

> `optional` **driver\_name?**: `string` \| `null`

##### Tables.bookings.Update.driver\_image?

> `optional` **driver\_image?**: `string` \| `null`

##### Tables.bookings.Update.driver\_contact?

> `optional` **driver\_contact?**: `string` \| `null`

##### Tables.bookings.Update.driver\_rating?

> `optional` **driver\_rating?**: `number` \| `null`

##### Tables.bookings.Update.car\_image?

> `optional` **car\_image?**: `string` \| `null`

##### Tables.bookings.Update.car\_model?

> `optional` **car\_model?**: `string` \| `null`

##### Tables.bookings.Update.car\_color?

> `optional` **car\_color?**: `string` \| `null`

##### Tables.bookings.Update.plate\_number?

> `optional` **plate\_number?**: `string` \| `null`

##### Tables.bookings.Update.vehicle\_number?

> `optional` **vehicle\_number?**: `string` \| `null`

##### Tables.bookings.Update.vehicle\_model?

> `optional` **vehicle\_model?**: `string` \| `null`

##### Tables.bookings.Update.vehicle\_make?

> `optional` **vehicle\_make?**: `string` \| `null`

##### Tables.bookings.Update.vehicle\_color?

> `optional` **vehicle\_color?**: `string` \| `null`

##### Tables.bookings.Update.customer\_token?

> `optional` **customer\_token?**: `string` \| `null`

##### Tables.bookings.Update.driver\_token?

> `optional` **driver\_token?**: `string` \| `null`

##### Tables.bookings.Update.payment\_mode?

> `optional` **payment\_mode?**: `string`

##### Tables.bookings.Update.prepaid?

> `optional` **prepaid?**: `boolean`

##### Tables.bookings.Update.rating?

> `optional` **rating?**: `number` \| `null`

##### Tables.bookings.Update.review?

> `optional` **review?**: `string` \| `null`

##### Tables.bookings.Update.reason?

> `optional` **reason?**: `string` \| `null`

##### Tables.bookings.Update.cancelled\_by?

> `optional` **cancelled\_by?**: `string` \| `null`

##### Tables.bookings.Update.cancellation\_time?

> `optional` **cancellation\_time?**: `string` \| `null`

##### Tables.bookings.Update.cancelled\_at?

> `optional` **cancelled\_at?**: `number` \| `null`

##### Tables.bookings.Update.incident?

> `optional` **incident?**: [`Json`](../type-aliases/Json.md)

##### Tables.bookings.Update.customer\_city?

> `optional` **customer\_city?**: `string` \| `null`

##### Tables.bookings.Update.driver\_city?

> `optional` **driver\_city?**: `string` \| `null`

##### Tables.bookings.Update.reference?

> `optional` **reference?**: `string` \| `null`

##### Tables.bookings.Update.created\_at?

> `optional` **created\_at?**: `string`

##### Tables.bookings.Update.updated\_at?

> `optional` **updated\_at?**: `string`

##### Tables.tracking

> **tracking**: `object`

##### Tables.tracking.Row

> **Row**: `object`

##### Tables.tracking.Row.id

> **id**: `string`

##### Tables.tracking.Row.booking\_id

> **booking\_id**: `string` \| `null`

##### Tables.tracking.Row.status

> **status**: `string`

##### Tables.tracking.Row.latitude

> **latitude**: `number`

##### Tables.tracking.Row.longitude

> **longitude**: `number`

##### Tables.tracking.Row.timestamp\_ms

> **timestamp\_ms**: `number`

##### Tables.tracking.Row.created\_at

> **created\_at**: `string`

##### Tables.tracking.Insert

> **Insert**: `object`

##### Tables.tracking.Insert.id?

> `optional` **id?**: `string`

##### Tables.tracking.Insert.booking\_id?

> `optional` **booking\_id?**: `string` \| `null`

##### Tables.tracking.Insert.status

> **status**: `string`

##### Tables.tracking.Insert.latitude

> **latitude**: `number`

##### Tables.tracking.Insert.longitude

> **longitude**: `number`

##### Tables.tracking.Insert.timestamp\_ms

> **timestamp\_ms**: `number`

##### Tables.tracking.Insert.created\_at?

> `optional` **created\_at?**: `string`

##### Tables.tracking.Update

> **Update**: `object`

##### Tables.tracking.Update.id?

> `optional` **id?**: `string`

##### Tables.tracking.Update.booking\_id?

> `optional` **booking\_id?**: `string` \| `null`

##### Tables.tracking.Update.status?

> `optional` **status?**: `string`

##### Tables.tracking.Update.latitude?

> `optional` **latitude?**: `number`

##### Tables.tracking.Update.longitude?

> `optional` **longitude?**: `number`

##### Tables.tracking.Update.timestamp\_ms?

> `optional` **timestamp\_ms?**: `number`

##### Tables.tracking.Update.created\_at?

> `optional` **created\_at?**: `string`

##### Tables.wallet\_history

> **wallet\_history**: `object`

##### Tables.wallet\_history.Row

> **Row**: `object`

##### Tables.wallet\_history.Row.id

> **id**: `string`

##### Tables.wallet\_history.Row.user\_id

> **user\_id**: `string` \| `null`

##### Tables.wallet\_history.Row.type

> **type**: `string`

##### Tables.wallet\_history.Row.amount

> **amount**: `number`

##### Tables.wallet\_history.Row.balance

> **balance**: `number`

##### Tables.wallet\_history.Row.description

> **description**: `string`

##### Tables.wallet\_history.Row.booking\_id

> **booking\_id**: `string` \| `null`

##### Tables.wallet\_history.Row.created\_at

> **created\_at**: `string`

##### Tables.wallet\_history.Insert

> **Insert**: `object`

##### Tables.wallet\_history.Insert.id?

> `optional` **id?**: `string`

##### Tables.wallet\_history.Insert.user\_id?

> `optional` **user\_id?**: `string` \| `null`

##### Tables.wallet\_history.Insert.type

> **type**: `string`

##### Tables.wallet\_history.Insert.amount

> **amount**: `number`

##### Tables.wallet\_history.Insert.balance

> **balance**: `number`

##### Tables.wallet\_history.Insert.description

> **description**: `string`

##### Tables.wallet\_history.Insert.booking\_id?

> `optional` **booking\_id?**: `string` \| `null`

##### Tables.wallet\_history.Insert.created\_at?

> `optional` **created\_at?**: `string`

##### Tables.wallet\_history.Update

> **Update**: `object`

##### Tables.wallet\_history.Update.id?

> `optional` **id?**: `string`

##### Tables.wallet\_history.Update.user\_id?

> `optional` **user\_id?**: `string` \| `null`

##### Tables.wallet\_history.Update.type?

> `optional` **type?**: `string`

##### Tables.wallet\_history.Update.amount?

> `optional` **amount?**: `number`

##### Tables.wallet\_history.Update.balance?

> `optional` **balance?**: `number`

##### Tables.wallet\_history.Update.description?

> `optional` **description?**: `string`

##### Tables.wallet\_history.Update.booking\_id?

> `optional` **booking\_id?**: `string` \| `null`

##### Tables.wallet\_history.Update.created\_at?

> `optional` **created\_at?**: `string`

##### Tables.notifications

> **notifications**: `object`

##### Tables.notifications.Row

> **Row**: `object`

##### Tables.notifications.Row.id

> **id**: `string`

##### Tables.notifications.Row.user\_id

> **user\_id**: `string` \| `null`

##### Tables.notifications.Row.title

> **title**: `string`

##### Tables.notifications.Row.message

> **message**: `string`

##### Tables.notifications.Row.type

> **type**: `string`

##### Tables.notifications.Row.is\_read

> **is\_read**: `boolean`

##### Tables.notifications.Row.data

> **data**: [`Json`](../type-aliases/Json.md)

##### Tables.notifications.Row.booking\_id

> **booking\_id**: `string` \| `null`

##### Tables.notifications.Row.created\_at

> **created\_at**: `string`

##### Tables.notifications.Insert

> **Insert**: `object`

##### Tables.notifications.Insert.id?

> `optional` **id?**: `string`

##### Tables.notifications.Insert.user\_id?

> `optional` **user\_id?**: `string` \| `null`

##### Tables.notifications.Insert.title

> **title**: `string`

##### Tables.notifications.Insert.message

> **message**: `string`

##### Tables.notifications.Insert.type?

> `optional` **type?**: `string`

##### Tables.notifications.Insert.is\_read?

> `optional` **is\_read?**: `boolean`

##### Tables.notifications.Insert.data?

> `optional` **data?**: [`Json`](../type-aliases/Json.md)

##### Tables.notifications.Insert.booking\_id?

> `optional` **booking\_id?**: `string` \| `null`

##### Tables.notifications.Insert.created\_at?

> `optional` **created\_at?**: `string`

##### Tables.notifications.Update

> **Update**: `object`

##### Tables.notifications.Update.id?

> `optional` **id?**: `string`

##### Tables.notifications.Update.user\_id?

> `optional` **user\_id?**: `string` \| `null`

##### Tables.notifications.Update.title?

> `optional` **title?**: `string`

##### Tables.notifications.Update.message?

> `optional` **message?**: `string`

##### Tables.notifications.Update.type?

> `optional` **type?**: `string`

##### Tables.notifications.Update.is\_read?

> `optional` **is\_read?**: `boolean`

##### Tables.notifications.Update.data?

> `optional` **data?**: [`Json`](../type-aliases/Json.md)

##### Tables.notifications.Update.booking\_id?

> `optional` **booking\_id?**: `string` \| `null`

##### Tables.notifications.Update.created\_at?

> `optional` **created\_at?**: `string`

##### Tables.user\_ratings

> **user\_ratings**: `object`

##### Tables.user\_ratings.Row

> **Row**: `object`

##### Tables.user\_ratings.Row.id

> **id**: `string`

##### Tables.user\_ratings.Row.user\_id

> **user\_id**: `string` \| `null`

##### Tables.user\_ratings.Row.rated\_by

> **rated\_by**: `string` \| `null`

##### Tables.user\_ratings.Row.booking\_id

> **booking\_id**: `string` \| `null`

##### Tables.user\_ratings.Row.rate

> **rate**: `number`

##### Tables.user\_ratings.Row.comment

> **comment**: `string` \| `null`

##### Tables.user\_ratings.Row.created\_at

> **created\_at**: `string`

##### Tables.user\_ratings.Insert

> **Insert**: `object`

##### Tables.user\_ratings.Insert.id?

> `optional` **id?**: `string`

##### Tables.user\_ratings.Insert.user\_id?

> `optional` **user\_id?**: `string` \| `null`

##### Tables.user\_ratings.Insert.rated\_by?

> `optional` **rated\_by?**: `string` \| `null`

##### Tables.user\_ratings.Insert.booking\_id?

> `optional` **booking\_id?**: `string` \| `null`

##### Tables.user\_ratings.Insert.rate

> **rate**: `number`

##### Tables.user\_ratings.Insert.comment?

> `optional` **comment?**: `string` \| `null`

##### Tables.user\_ratings.Insert.created\_at?

> `optional` **created\_at?**: `string`

##### Tables.user\_ratings.Update

> **Update**: `object`

##### Tables.user\_ratings.Update.id?

> `optional` **id?**: `string`

##### Tables.user\_ratings.Update.user\_id?

> `optional` **user\_id?**: `string` \| `null`

##### Tables.user\_ratings.Update.rated\_by?

> `optional` **rated\_by?**: `string` \| `null`

##### Tables.user\_ratings.Update.booking\_id?

> `optional` **booking\_id?**: `string` \| `null`

##### Tables.user\_ratings.Update.rate?

> `optional` **rate?**: `number`

##### Tables.user\_ratings.Update.comment?

> `optional` **comment?**: `string` \| `null`

##### Tables.user\_ratings.Update.created\_at?

> `optional` **created\_at?**: `string`

##### Tables.saved\_addresses

> **saved\_addresses**: `object`

##### Tables.saved\_addresses.Row

> **Row**: `object`

##### Tables.saved\_addresses.Row.id

> **id**: `string`

##### Tables.saved\_addresses.Row.user\_id

> **user\_id**: `string` \| `null`

##### Tables.saved\_addresses.Row.name

> **name**: `string` \| `null`

##### Tables.saved\_addresses.Row.address

> **address**: `string`

##### Tables.saved\_addresses.Row.latitude

> **latitude**: `number`

##### Tables.saved\_addresses.Row.longitude

> **longitude**: `number`

##### Tables.saved\_addresses.Row.is\_default

> **is\_default**: `boolean`

##### Tables.saved\_addresses.Row.created\_at

> **created\_at**: `string`

##### Tables.saved\_addresses.Insert

> **Insert**: `object`

##### Tables.saved\_addresses.Insert.id?

> `optional` **id?**: `string`

##### Tables.saved\_addresses.Insert.user\_id?

> `optional` **user\_id?**: `string` \| `null`

##### Tables.saved\_addresses.Insert.name?

> `optional` **name?**: `string` \| `null`

##### Tables.saved\_addresses.Insert.address

> **address**: `string`

##### Tables.saved\_addresses.Insert.latitude

> **latitude**: `number`

##### Tables.saved\_addresses.Insert.longitude

> **longitude**: `number`

##### Tables.saved\_addresses.Insert.is\_default?

> `optional` **is\_default?**: `boolean`

##### Tables.saved\_addresses.Insert.created\_at?

> `optional` **created\_at?**: `string`

##### Tables.saved\_addresses.Update

> **Update**: `object`

##### Tables.saved\_addresses.Update.id?

> `optional` **id?**: `string`

##### Tables.saved\_addresses.Update.user\_id?

> `optional` **user\_id?**: `string` \| `null`

##### Tables.saved\_addresses.Update.name?

> `optional` **name?**: `string` \| `null`

##### Tables.saved\_addresses.Update.address?

> `optional` **address?**: `string`

##### Tables.saved\_addresses.Update.latitude?

> `optional` **latitude?**: `number`

##### Tables.saved\_addresses.Update.longitude?

> `optional` **longitude?**: `number`

##### Tables.saved\_addresses.Update.is\_default?

> `optional` **is\_default?**: `boolean`

##### Tables.saved\_addresses.Update.created\_at?

> `optional` **created\_at?**: `string`

##### Tables.promos

> **promos**: `object`

##### Tables.promos.Row

> **Row**: `object`

##### Tables.promos.Row.id

> **id**: `string`

##### Tables.promos.Row.title

> **title**: `string`

##### Tables.promos.Row.description

> **description**: `string` \| `null`

##### Tables.promos.Row.discount\_type

> **discount\_type**: `string` \| `null`

##### Tables.promos.Row.discount\_value

> **discount\_value**: `number` \| `null`

##### Tables.promos.Row.min\_amount

> **min\_amount**: `number` \| `null`

##### Tables.promos.Row.max\_discount

> **max\_discount**: `number` \| `null`

##### Tables.promos.Row.start\_date

> **start\_date**: `string` \| `null`

##### Tables.promos.Row.end\_date

> **end\_date**: `string` \| `null`

##### Tables.promos.Row.is\_active

> **is\_active**: `boolean`

##### Tables.promos.Row.usage\_limit

> **usage\_limit**: `number` \| `null`

##### Tables.promos.Row.used\_count

> **used\_count**: `number`

##### Tables.promos.Row.created\_at

> **created\_at**: `string`

##### Tables.promos.Insert

> **Insert**: `object`

##### Tables.promos.Insert.id?

> `optional` **id?**: `string`

##### Tables.promos.Insert.title

> **title**: `string`

##### Tables.promos.Insert.description?

> `optional` **description?**: `string` \| `null`

##### Tables.promos.Insert.discount\_type?

> `optional` **discount\_type?**: `string` \| `null`

##### Tables.promos.Insert.discount\_value?

> `optional` **discount\_value?**: `number` \| `null`

##### Tables.promos.Insert.min\_amount?

> `optional` **min\_amount?**: `number` \| `null`

##### Tables.promos.Insert.max\_discount?

> `optional` **max\_discount?**: `number` \| `null`

##### Tables.promos.Insert.start\_date?

> `optional` **start\_date?**: `string` \| `null`

##### Tables.promos.Insert.end\_date?

> `optional` **end\_date?**: `string` \| `null`

##### Tables.promos.Insert.is\_active?

> `optional` **is\_active?**: `boolean`

##### Tables.promos.Insert.usage\_limit?

> `optional` **usage\_limit?**: `number` \| `null`

##### Tables.promos.Insert.used\_count?

> `optional` **used\_count?**: `number`

##### Tables.promos.Insert.created\_at?

> `optional` **created\_at?**: `string`

##### Tables.promos.Update

> **Update**: `object`

##### Tables.promos.Update.id?

> `optional` **id?**: `string`

##### Tables.promos.Update.title?

> `optional` **title?**: `string`

##### Tables.promos.Update.description?

> `optional` **description?**: `string` \| `null`

##### Tables.promos.Update.discount\_type?

> `optional` **discount\_type?**: `string` \| `null`

##### Tables.promos.Update.discount\_value?

> `optional` **discount\_value?**: `number` \| `null`

##### Tables.promos.Update.min\_amount?

> `optional` **min\_amount?**: `number` \| `null`

##### Tables.promos.Update.max\_discount?

> `optional` **max\_discount?**: `number` \| `null`

##### Tables.promos.Update.start\_date?

> `optional` **start\_date?**: `string` \| `null`

##### Tables.promos.Update.end\_date?

> `optional` **end\_date?**: `string` \| `null`

##### Tables.promos.Update.is\_active?

> `optional` **is\_active?**: `boolean`

##### Tables.promos.Update.usage\_limit?

> `optional` **usage\_limit?**: `number` \| `null`

##### Tables.promos.Update.used\_count?

> `optional` **used\_count?**: `number`

##### Tables.promos.Update.created\_at?

> `optional` **created\_at?**: `string`

#### Views

> **Views**: `object`

#### Functions

> **Functions**: `object`

#### Enums

> **Enums**: `object`

#### CompositeTypes

> **CompositeTypes**: `object`
