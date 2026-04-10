import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface ServiceOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  basePrice: number;
  isSelected: boolean;
}

interface ServiceParameterSelectorProps {
  onParametersChange?: (params: any) => void;
  basePrice?: number;
  currentService?: string;
}

export const ServiceParameterSelector: React.FC<ServiceParameterSelectorProps> = ({
  onParametersChange,
  basePrice = 0,
  currentService = 'express',
}) => {
  const [selectedService, setSelectedService] = useState(currentService);
  const [specialRequests, setSpecialRequests] = useState('');
  const [requiresChildSeat, setRequiresChildSeat] = useState(false);
  const [accessibilityNeeded, setAccessibilityNeeded] = useState(false);

  const services: ServiceOption[] = [
    {
      id: 'express',
      title: 'Express',
      description: 'Viaje rápido y directo',
      icon: 'local-shipping',
      basePrice: basePrice,
      isSelected: selectedService === 'express',
    },
    {
      id: 'comfort',
      title: 'Comfort',
      description: 'Mayor comodidad',
      icon: 'event-seat',
      basePrice: basePrice * 1.15,
      isSelected: selectedService === 'comfort',
    },
    {
      id: 'moto',
      title: 'Moto',
      description: 'Rápido en tráfico',
      icon: 'two-wheeler',
      basePrice: basePrice * 0.7,
      isSelected: selectedService === 'moto',
    },
    {
      id: 'priority',
      title: 'Más rápido',
      description: 'Prioridad máxima',
      icon: 'flash-on',
      basePrice: basePrice * 1.3,
      isSelected: selectedService === 'priority',
    },
  ];

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    const service = services.find(s => s.id === serviceId);
    onParametersChange?.({
      service: serviceId,
      price: service?.basePrice,
      specialRequests,
      requiresChildSeat,
      accessibilityNeeded,
    });
  };

  const currentServicePrice = services.find(s => s.id === selectedService)?.basePrice || basePrice;

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Service Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Elige tu servicio</Text>
        <View style={styles.servicesGrid}>
          {services.map(service => (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.serviceCard,
                selectedService === service.id && styles.serviceCardSelected,
              ]}
              onPress={() => handleServiceSelect(service.id)}
            >
              <View style={styles.serviceIconContainer}>
                <MaterialIcons
                  name={service.icon as any}
                  size={24}
                  color={selectedService === service.id ? '#051A26' : '#00E5FF'}
                />
              </View>
              <Text style={styles.serviceTitle}>{service.title}</Text>
              <Text style={styles.serviceDescription}>{service.description}</Text>
              <Text style={styles.servicePrice}>
                ${service.basePrice.toFixed(2)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Price Breakdown */}
      <View style={styles.priceSection}>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Tarifa base</Text>
          <Text style={styles.priceValue}>${currentServicePrice.toFixed(2)}</Text>
        </View>
        <View style={styles.priceDivider} />
        <View style={styles.priceRow}>
          <Text style={[styles.priceLabel, styles.totalLabel]}>Total estimado</Text>
          <Text style={[styles.priceValue, styles.totalPrice]}>
            ${currentServicePrice.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Special Requests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Solicitudes especiales</Text>
        
        <View style={styles.toggleRow}>
          <View style={styles.toggleContent}>
            <MaterialIcons name="child-care" size={20} color="#00E5FF" />
            <Text style={styles.toggleLabel}>Requiere silla para niño</Text>
          </View>
          <Switch
            value={requiresChildSeat}
            onValueChange={(value) => {
              setRequiresChildSeat(value);
              onParametersChange?.({
                service: selectedService,
                price: currentServicePrice,
                specialRequests,
                requiresChildSeat: value,
                accessibilityNeeded,
              });
            }}
            trackColor={{ false: 'rgba(0,229,255,0.1)', true: 'rgba(0,229,255,0.3)' }}
            thumbColor={requiresChildSeat ? '#00E5FF' : '#7FA3B8'}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleContent}>
            <MaterialIcons name="accessible" size={20} color="#00E5FF" />
            <Text style={styles.toggleLabel}>Requiere accesibilidad</Text>
          </View>
          <Switch
            value={accessibilityNeeded}
            onValueChange={(value) => {
              setAccessibilityNeeded(value);
              onParametersChange?.({
                service: selectedService,
                price: currentServicePrice,
                specialRequests,
                requiresChildSeat,
                accessibilityNeeded: value,
              });
            }}
            trackColor={{ false: 'rgba(0,229,255,0.1)', true: 'rgba(0,229,255,0.3)' }}
            thumbColor={accessibilityNeeded ? '#00E5FF' : '#7FA3B8'}
          />
        </View>
      </View>

      {/* Additional Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notas adicionales (opcional)</Text>
        <View style={styles.notesBox}>
          <Text style={styles.notesPlaceholder}>
            {specialRequests || 'Añade detalles especiales para el conductor...'}
          </Text>
        </View>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  serviceCard: {
    width: (width - 52) / 2,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.15)',
    justifyContent: 'center',
  },
  serviceCardSelected: {
    backgroundColor: '#00E5FF',
    borderColor: '#00E5FF',
  },
  serviceIconContainer: {
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 12,
    color: '#B8C5D6',
    textAlign: 'center',
    marginBottom: 8,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#00E5FF',
  },
  priceSection: {
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.15)',
    marginBottom: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 13,
    color: '#B8C5D6',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00E5FF',
  },
  priceDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
    marginVertical: 6,
  },
  totalLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '900',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 229, 255, 0.06)',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.1)',
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleLabel: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 10,
  },
  notesBox: {
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.15)',
    minHeight: 60,
    justifyContent: 'center',
  },
  notesPlaceholder: {
    fontSize: 13,
    color: '#7FA3B8',
    fontStyle: 'italic',
  },
  spacer: {
    height: 40,
  },
});

export default ServiceParameterSelector;
