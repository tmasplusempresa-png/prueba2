import base64 from 'react-native-base64';
import AccessKey from './AccessKey';
import { firebase, FirebaseConfig } from '@/config/configureFirebase';

interface SearchResults {
  searchResults: any[]; // Define la estructura correcta según la respuesta real de tu API
}

interface CoordsResponse {
  coords: {
    lat: number;
    lng: number;
  };
}

interface AddressResponse {
  address: string;
}

interface DistanceMatrixResponse {
  distance_in_km: number;
  // Define otras propiedades según la respuesta real de tu API
}

interface DirectionsApiResponse {
  // Define las propiedades según la respuesta real de tu API
}

export const fetchPlacesAutocomplete = (searchKeyword: string, sessionToken: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const { config }: { config: FirebaseConfig } = firebase;
    fetch(`https://${config.projectId}.web.app/googleapi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "Authorization": "Basic " + base64.encode(config.projectId + ":" + AccessKey)
      },
      body: JSON.stringify({
        "searchKeyword": searchKeyword,
        "sessiontoken": sessionToken
      })
    }).then(response => {
      return response.json();
    })
      .then((json: SearchResults | any) => {
        if (json && json.searchResults) {
          resolve(json.searchResults);
        } else {
          reject(json.error);
        }
      }).catch(error => {
        //console.log(error);
        reject("fetchPlacesAutocomplete Call Error");
      });
  });
}

export const fetchCoordsfromPlace = (place_id: string): Promise<{ lat: number, lng: number }> => {
  return new Promise((resolve, reject) => {
    const { config }: { config: FirebaseConfig } = firebase;
    fetch(`https://${config.projectId}.web.app/googleapi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "Authorization": "Basic " + base64.encode(config.projectId + ":" + AccessKey)
      },
      body: JSON.stringify({
        "place_id": place_id
      })
    }).then(response => {
      return response.json();
    })
      .then((json: CoordsResponse | any) => {
        if (json && json.coords) {
          resolve(json.coords);
        } else {
          reject(json.error);
        }
      }).catch(error => {
        //console.log(error);
        reject("fetchCoordsfromPlace Call Error");
      });
  });
}

export const fetchAddressfromCoords = (latlng: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const { config }: { config: FirebaseConfig } = firebase;
    fetch(`https://${config.projectId}.web.app/googleapi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "Authorization": "Basic " + base64.encode(config.projectId + ":" + AccessKey)
      },
      body: JSON.stringify({
        "latlng": latlng
      })
    }).then(response => {
      return response.json();
    })
      .then((json: AddressResponse | any) => {
        if (json && json.address) {
          resolve(json.address);
        } else {
          reject(json.error);
        }
      }).catch(error => {
        //console.log(error);
        reject("fetchAddressfromCoords Call Error");
      });
  });
}

export const getDistanceMatrix = (startLoc: string, destLoc: string): Promise<DistanceMatrixResponse> => {
  return new Promise((resolve, reject) => {
    const { config }: { config: FirebaseConfig } = firebase;
    fetch(`https://${config.projectId}.web.app/googleapi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "Authorization": "Basic " + base64.encode(config.projectId + ":" + AccessKey)
      },
      body: JSON.stringify({
        "start": startLoc,
        "dest": destLoc,
        "calltype": "matrix",
      })
    }).then(response => {
      return response.json();
    })
      .then((json: DistanceMatrixResponse | any) => {
        if (json.error) {
          //console.log(json.error);
          reject(json.error);
        } else {
          resolve(json);
        }
      }).catch(error => {
        //console.log(error);
        reject("getDistanceMatrix Call Error");
      });
  });
}

export const getDirectionsApi = (startLoc: string, destLoc: string, waypoints?: string[]): Promise<DirectionsApiResponse> => {
  return new Promise((resolve, reject) => {
    const { config }: { config: FirebaseConfig } = firebase;
    const body: any = {
      "start": startLoc,
      "dest": destLoc,
      "calltype": "direction",
    };
    if (waypoints) {
      body["waypoints"] = waypoints;
    }
    fetch(`https://${config.projectId}.web.app/googleapi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "Authorization": "Basic " + base64.encode(config.projectId + ":" + AccessKey)
      },
      body: JSON.stringify(body)
    }).then(response => {
      return response.json();
    })
      .then((json: DirectionsApiResponse | any) => {
        if (json.hasOwnProperty('distance_in_km')) {
          resolve(json);
        } else {
          //console.log(json.error);
          reject(json.error);
        }
      }).catch(error => {
        //console.log(error);
        reject("getDirectionsApi Call Error");
      });
  });
}