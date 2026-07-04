import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import CarnetScreen from '../CarnetScreen';

// ─── Mocks ─────────────────────────────────────────────────────────────────

jest.mock('@/config/SupabaseConfig', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

// ─── Helpers ───────────────────────────────────────────────────────────────

const makeStore = (authState: object) =>
  configureStore({ reducer: { auth: () => authState } });

const mockNavigation = { goBack: jest.fn(), navigate: jest.fn() };

const renderCarnet = (authState: object) =>
  render(
    <Provider store={makeStore(authState)}>
      <CarnetScreen navigation={mockNavigation as any} route={{} as any} />
    </Provider>,
  );

// ─── Estado base del rider ─────────────────────────────────────────────────

const riderAuth = {
  user: {
    id: 'uid-1',
    email: 'rider@example.com',
    user_type: 'rider',
  },
  profile: {
    user_type: 'rider',
    auth_id: 'uid-1',
    first_name: 'Laura',
    last_name: 'Gómez',
    document_type: 'Cédula de Ciudadanía',
    document_number: '1234567890',
  },
};

const driverAuth = {
  user: {
    id: 'uid-2',
    email: 'driver@example.com',
    user_type: 'driver',
  },
  profile: {
    user_type: 'driver',
    auth_id: 'uid-2',
    first_name: 'Carlos',
    last_name: 'Ramírez',
  },
};

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('CarnetScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rider', () => {
    it('muestra el header "Carnet"', () => {
      renderCarnet(riderAuth);
      expect(screen.getByText('Carnet')).toBeTruthy();
    });

    it('muestra el email del usuario', () => {
      renderCarnet(riderAuth);
      expect(screen.getByText('rider@example.com')).toBeTruthy();
    });

    it('muestra el nombre y apellido desde el perfil Redux', () => {
      renderCarnet(riderAuth);
      expect(screen.getByText('Laura Gómez')).toBeTruthy();
    });

    it('muestra el tipo de documento del perfil Redux', () => {
      renderCarnet(riderAuth);
      expect(screen.getByText('Cédula de Ciudadanía')).toBeTruthy();
    });

    it('muestra el número de documento del perfil Redux', () => {
      renderCarnet(riderAuth);
      expect(screen.getByText('1234567890')).toBeTruthy();
    });

    it('no muestra la fila de Categoría de Vehículo para riders', () => {
      renderCarnet(riderAuth);
      expect(screen.queryByText('Categoría de Vehículo')).toBeNull();
    });
  });

  describe('Driver', () => {
    it('muestra el nombre del conductor desde el perfil Redux', () => {
      renderCarnet(driverAuth);
      expect(screen.getByText('Carlos Ramírez')).toBeTruthy();
    });

    it('muestra la fila de Categoría de Vehículo para drivers', async () => {
      renderCarnet(driverAuth);
      await waitFor(() => {
        expect(screen.getByText('Categoría de Vehículo')).toBeTruthy();
      });
    });

    it('muestra "No definido" cuando no hay categoría de vehículo', async () => {
      renderCarnet(driverAuth);
      await waitFor(() => {
        expect(screen.getByText('No definido')).toBeTruthy();
      });
    });
  });

  describe('Valores de fallback', () => {
    it('muestra "No disponible" cuando el usuario no tiene email', () => {
      renderCarnet({ user: { id: 'uid-3' }, profile: null });
      expect(screen.getByText('No disponible')).toBeTruthy();
    });

    it('muestra "Usuario" como nombre cuando no hay datos de perfil', () => {
      renderCarnet({ user: {}, profile: null });
      expect(screen.getByText(/Usuario/)).toBeTruthy();
    });

    it('muestra "N/A" cuando no hay tipo de documento', () => {
      renderCarnet({ user: { id: 'uid-3', email: 'a@b.com' }, profile: null });
      const naItems = screen.getAllByText('N/A');
      expect(naItems.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Navegación', () => {
    it('llama a goBack al presionar el botón de retroceso', () => {
      renderCarnet(riderAuth);
      fireEvent.press(screen.getByTestId('back-button'));
      expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
    });
  });
});
