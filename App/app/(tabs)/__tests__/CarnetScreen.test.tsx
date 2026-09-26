import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import CarnetScreen, { buildCarnetQrPayload, formatCarnetCity } from '../CarnetScreen';

// ─── Mocks ─────────────────────────────────────────────────────────────────

jest.mock('@/config/SupabaseConfig', () => ({
  supabase: {
    auth: { getSession: jest.fn().mockResolvedValue({ data: { session: null } }) },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

jest.mock('react-native-qrcode-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function MockQRCode() {
    return React.createElement(View, { testID: 'carnet-qr' });
  };
});

// ─── Helpers ───────────────────────────────────────────────────────────────

const makeStore = (authState: object) =>
  configureStore({ reducer: { auth: () => authState } });

const mockNavigation = { goBack: jest.fn(), navigate: jest.fn(), canGoBack: jest.fn(() => true) };

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
    city: 'Bogotá',
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
    it('muestra el header "Mi Carnet"', () => {
      renderCarnet(riderAuth);
      expect(screen.getByText('Mi Carnet')).toBeTruthy();
    });

    it('muestra el email del usuario', () => {
      renderCarnet(riderAuth);
      expect(screen.getByText('rider@example.com')).toBeTruthy();
    });

    it('muestra el nombre y apellido desde el perfil Redux', () => {
      renderCarnet(riderAuth);
      expect(screen.getAllByText('Laura Gómez').length).toBeGreaterThanOrEqual(1);
    });

    it('muestra el tipo de documento del perfil Redux', () => {
      renderCarnet(riderAuth);
      expect(screen.getByText('Cédula de Ciudadanía')).toBeTruthy();
    });

    it('muestra el número de documento del perfil Redux', () => {
      renderCarnet(riderAuth);
      expect(screen.getByText('1234567890')).toBeTruthy();
    });

    it('muestra la ciudad con formato Colombia', () => {
      renderCarnet(riderAuth);
      expect(screen.getByText('Bogotá, Colombia')).toBeTruthy();
    });

    it('muestra el código QR del carnet', () => {
      renderCarnet(riderAuth);
      expect(screen.getByTestId('carnet-qr-section')).toBeTruthy();
      expect(screen.getByTestId('carnet-qr')).toBeTruthy();
    });
  });

  describe('Driver', () => {
    it('muestra el nombre del conductor desde el perfil Redux', () => {
      renderCarnet(driverAuth);
      expect(screen.getAllByText('Carlos Ramírez').length).toBeGreaterThanOrEqual(1);
    });

    it('muestra la categoría de vehículo para drivers', async () => {
      renderCarnet(driverAuth);
      await waitFor(() => {
        expect(screen.getByTestId('vehicle-category-row')).toBeTruthy();
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
      expect(screen.getAllByText(/Usuario/).length).toBeGreaterThanOrEqual(1);
    });

    it('muestra "N/A" cuando no hay tipo de documento', () => {
      renderCarnet({ user: { id: 'uid-3', email: 'a@b.com' }, profile: null });
      const naItems = screen.getAllByText('N/A');
      expect(naItems.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Utilidades del carnet', () => {
    it('formatea la ciudad con Colombia', () => {
      expect(formatCarnetCity('Bogotá')).toBe('Bogotá, Colombia');
      expect(formatCarnetCity('Medellín, Colombia')).toBe('Medellín, Colombia');
    });

    it('arma el payload del QR con todos los datos del portador', () => {
      const payload = buildCarnetQrPayload({
        fullName: 'Laura Gómez',
        roleLabel: 'Cliente',
        documentType: 'CC',
        documentNumber: '1234567890',
        email: 'rider@example.com',
        city: 'Bogotá, Colombia',
      });

      expect(payload).toBe(
        'T+PLUS CARNET\nLaura Gómez\nCliente\nCC 1234567890\nrider@example.com\nBogotá, Colombia',
      );
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
