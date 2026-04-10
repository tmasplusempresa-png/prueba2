
import { get, update } from 'firebase/database';
import { configureStore } from '@reduxjs/toolkit';

// Mockear las funciones de Firebase
jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  get: jest.fn(),
  update: jest.fn(),
}));

describe('kilometersSlice', () => {
  let store;

  beforeEach(() => {
    // Configuramos un store temporal para nuestras pruebas
    store = configureStore({
      reducer: {
        kilometers: kilometersReducer,
      },
    });
  });

  describe('fetchKilometers', () => {
    it('should fetch and return kilometers if successful', async () => {
      // Mock de Firebase `get` para retornar un valor existente
      (get as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        val: () => 1000,
      });

      const result = await store.dispatch(fetchKilometers('test-uid'));
      const state = store.getState();

      expect(result.type).toBe('kilometers/fetchKilometers/fulfilled');
      expect(state.kilometers.kilometers).toBe(1000);
    });

    it('should initialize kilometers to 500 if not found', async () => {
      // Mock de Firebase `get` para retornar que no existe el dato
      (get as jest.Mock).mockResolvedValueOnce({
        exists: () => false,
      });

      // Mock de `update` para simular la inicialización a 500 km
      (update as jest.Mock).mockResolvedValueOnce();

      const result = await store.dispatch(fetchKilometers('test-uid'));
      const state = store.getState();

      expect(result.type).toBe('kilometers/fetchKilometers/fulfilled');
      expect(state.kilometers.kilometers).toBe(500);
    });

    it('should handle errors when fetching kilometers', async () => {
      // Mock para simular un error en Firebase
      (get as jest.Mock).mockRejectedValueOnce(new Error('Firebase error'));

      const result = await store.dispatch(fetchKilometers('test-uid'));
      const state = store.getState();

      expect(result.type).toBe('kilometers/fetchKilometers/rejected');
      expect(state.kilometers.error).toBe('Firebase error');
    });
  });

  describe('addKilometers', () => {
    it('should add kilometers successfully', async () => {
      // Mock de Firebase `get` para retornar los kilómetros actuales
      (get as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        val: () => 1000,
      });

      // Mock de `update` para simular la actualización exitosa
      (update as jest.Mock).mockResolvedValueOnce();

      const result = await store.dispatch(addKilometers({ uid: 'test-uid', kilometersToAdd: 200 }));
      const state = store.getState();

      expect(result.type).toBe('kilometers/addKilometers/fulfilled');
      expect(state.kilometers.kilometers).toBe(1200);
    });

    it('should handle errors when adding kilometers', async () => {
      // Mock para simular un error en Firebase
      (get as jest.Mock).mockRejectedValueOnce(new Error('Error fetching kilometers'));

      const result = await store.dispatch(addKilometers({ uid: 'test-uid', kilometersToAdd: 200 }));
      const state = store.getState();

      expect(result.type).toBe('kilometers/addKilometers/rejected');
      expect(state.kilometers.error).toBe('Error fetching kilometers');
    });
  });
});