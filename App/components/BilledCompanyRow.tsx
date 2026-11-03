import React from 'react';
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BookingCompany } from '@/common/services/companiesService';

/** "Facturado a <empresa>" para viajes empresariales, igual en el viaje en curso y en el detalle. */
export function BilledCompanyRow({
  company,
  style,
  hidePaymentStatus = false,
}: {
  company: BookingCompany;
  style?: StyleProp<ViewStyle>;
  hidePaymentStatus?: boolean;
}) {
  const paid = company.driverPaymentStatus === 'pagado';
  return (
    <View style={[styles.row, style]}>
      <View style={styles.logoBox}>
        {company.logoUrl ? (
          <Image source={{ uri: company.logoUrl }} style={styles.logo} />
        ) : (
          <Ionicons name="business" size={18} color="#00E5FF" />
        )}
      </View>
      <View style={styles.texts}>
        <Text style={styles.label}>Facturado a</Text>
        <Text style={styles.name} numberOfLines={1}>{company.name}</Text>
        {company.costCenter ? (
          <Text style={styles.extra} numberOfLines={1}>Centro de costo: {company.costCenter}</Text>
        ) : null}
      </View>
      {company.driverPaymentStatus && !hidePaymentStatus ? (
        <View style={[styles.payPill, paid ? styles.payPillPaid : styles.payPillPending]}>
          <Text style={[styles.payPillTxt, paid ? styles.payPillTxtPaid : styles.payPillTxtPending]}>
            {paid ? 'Pagado' : 'Por pagar'}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0,229,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: { width: '100%', height: '100%' },
  texts: { flex: 1, minWidth: 0 },
  label: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },
  name: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginTop: 1 },
  extra: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  payPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  payPillPaid: { backgroundColor: 'rgba(0,230,118,0.12)', borderColor: 'rgba(0,230,118,0.4)' },
  payPillPending: { backgroundColor: 'rgba(255,179,0,0.12)', borderColor: 'rgba(255,179,0,0.4)' },
  payPillTxt: { fontSize: 10, fontWeight: '800' },
  payPillTxtPaid: { color: '#00E676' },
  payPillTxtPending: { color: '#FFB300' },
});
