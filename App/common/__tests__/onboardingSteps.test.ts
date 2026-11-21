import { buildOnboardingSteps, mergeProfiles } from '@/common/utils/onboardingSteps';

const full = {
  profile_image: 'a', verify_id_image: 'a', verify_id_image_bk: 'a', license_image: 'a',
  license_image_back: 'a', soat_image: 'a', card_prop_image: 'a', card_prop_image_bk: 'a',
};

describe('buildOnboardingSteps', () => {
  it('conductor con todo completo no tiene pendientes', () => {
    const steps = buildOnboardingSteps('driver', full, 1);
    expect(steps).toHaveLength(9);
    expect(steps.every((s) => s.done)).toBe(true);
  });

  it('conductor: vacío, espacios y null cuentan como pendiente', () => {
    const steps = buildOnboardingSteps('driver', { ...full, soat_image: '  ', license_image: null, profile_image: '' }, 0);
    expect(steps.filter((s) => !s.done).map((s) => s.key)).toEqual(['profile_image', 'license_front', 'soat', 'vehicle']);
  });

  it('conductor: si no se pudo contar vehículos no se marca pendiente', () => {
    const steps = buildOnboardingSteps('driver', full, null);
    expect(steps.find((s) => s.key === 'vehicle')?.done).toBe(true);
  });

  it('cliente: solo cédula y foto', () => {
    const steps = buildOnboardingSteps('customer', { verify_id_image: 'a' }, null);
    expect(steps.map((s) => [s.key, s.done])).toEqual([['id_front', true], ['id_back', false], ['profile_image', false]]);
  });

  it('otros tipos no tienen pasos', () => {
    expect(buildOnboardingSteps('company', {}, null)).toEqual([]);
  });
});

describe('mergeProfiles', () => {
  it('basta que remoto o local tenga el valor', () => {
    const m = mergeProfiles({ soat_image: '' }, { soat_image: 'x', profile_image: 'y' });
    expect(m.soat_image).toBe('x');
    expect(m.profile_image).toBe('y');
  });
});
