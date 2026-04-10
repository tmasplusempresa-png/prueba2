// config/SupabaseStorage.ts
// Funciones de Storage específicas para T+Plus - Complementa SupabaseConfig.ts
import { supabase } from './SupabaseConfig'; // ← Usa tu configuración existente

// ==================== TIPOS DE STORAGE T+PLUS ====================
export interface StorageUploadResult {
  url: string | null;
  error: string | null;
  path: string | null;
}

// ==================== CONSTANTES DE BUCKETS ====================
export const STORAGE_BUCKETS = {
  USER_PROFILES: 'user-profiles',
  USER_DOCUMENTS: 'user-documents',
  VEHICLE_DOCUMENTS: 'vehicle-documents',
  DRIVER_DOCUMENTS: 'driver-documents',
  VEHICLE_IMAGES: 'vehicle-images',
  CAR_IMAGES: 'vehicle-images',
  BOOKING_MEDIA: 'booking-media'
} as const;

// ==================== FUNCIONES DE MIGRACIÓN FIREBASE → SUPABASE ====================

/**
 * MIGRAR: users/{uid}/profile_image.jpg (Firebase) 
 * → user-profiles/{uid}/profile_image.jpg (Supabase)
 */
export const uploadProfileImage = async (
  userId: string,
  imageFile: File | Blob,
  contentType: string = 'image/jpeg'
): Promise<StorageUploadResult> => {
  try {
    const fileName = `${userId}/profile_image.jpg`;
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.USER_PROFILES)
      .upload(fileName, imageFile, {
        contentType,
        upsert: true, // Permite sobrescribir
      });

    if (error) {
      console.error('Error uploading profile image:', error);
      return { url: null, error: error.message, path: null };
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.USER_PROFILES)
      .getPublicUrl(fileName);

    console.log('Profile image uploaded:', urlData.publicUrl);
    return {
      url: urlData.publicUrl,
      error: null,
      path: fileName
    };
  } catch (error) {
    console.error('Upload profile image failed:', error);
    return {
      url: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      path: null
    };
  }
};

/**
 * MIGRAR: users/{uid}/{documentName} (Firebase)
 * → user-documents/{uid}/{documentName} (Supabase) 
 */
export const uploadUserDocument = async (userId: string, documentName: string, imageFile: File | Blob, contentType: string = 'image/jpeg' ): Promise<StorageUploadResult> => {
  try {
    const fileName = `${userId}/${documentName}`;
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.USER_DOCUMENTS)
      .upload(fileName, imageFile, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error('Error uploading user document:', error);
      return { url: null, error: error.message, path: null };
    }

    // Para documentos privados, usar signedURL
    const { data: urlData, error: urlError } = await supabase.storage
      .from(STORAGE_BUCKETS.USER_DOCUMENTS)
      .createSignedUrl(fileName, 3600); 

    if (urlError) {
      console.error('Error creating signed URL:', urlError);
      return { url: null, error: urlError.message, path: null };
    }

    console.log('User document uploaded:', fileName);
    return {
      url: urlData.signedUrl,
      error: null,
      path: fileName
    };
  } catch (error) {
    console.error('Upload user document failed:', error);
    return {
      url: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      path: null
    };
  }
};

/**
 * MIGRAR: cars/{carId} (Firebase)
 * → vehicle-images/{carId}/car_image.jpg (Supabase)
 */
export const uploadCarImage = async (
  carId: string,
  imageFile: File | Blob,
  contentType: string = 'image/jpeg'
): Promise<StorageUploadResult> => {
  try {
    const fileName = `${carId}/car_image.jpg`;
    
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.CAR_IMAGES)
      .upload(fileName, imageFile, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error('Error uploading car image:', error);
      return { url: null, error: error.message, path: null };
    }

    // URL pública para imágenes de vehículos
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.CAR_IMAGES)
      .getPublicUrl(fileName);

    return {
      url: urlData.publicUrl,
      error: null,
      path: fileName
    };
  } catch (error) {
    console.error('Upload car image failed:', error);
    return {
      url: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      path: null
    };
  }
};

/**
 * Obtener URL firmada para documento privado
 */
export const getDocumentSignedUrl = async (
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Get signed URL failed:', error);
    return null;
  }
};

/**
 * Eliminar archivo de storage
 */
export const deleteStorageFile = async (
  bucket: string,
  path: string
): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }

    console.log('File deleted:', path);
    return true;
  } catch (error) {
    console.error('Delete file failed:', error);
    return false;
  }
};

// ==================== HELPERS PARA MIGRACIÓN ====================

export const convertFirebasePathToSupabase = (
  firebasePath: string
): { bucket: string; path: string } => {
  // users/{uid}/profile_image.jpg → user-profiles bucket
  if (firebasePath.includes('profile_image')) {
    const uid = firebasePath.split('/')[1];
    return {
      bucket: STORAGE_BUCKETS.USER_PROFILES,
      path: `${uid}/profile_image.jpg`
    };
  }
  
  // users/{uid}/{documentName} → user-documents bucket
  if (firebasePath.startsWith('users/')) {
    const parts = firebasePath.split('/');
    const uid = parts[1];
    const documentName = parts[2];
    return {
      bucket: STORAGE_BUCKETS.USER_DOCUMENTS,
      path: `${uid}/${documentName}`
    };
  }
  
  // cars/{carId} → vehicle-images bucket
  if (firebasePath.startsWith('cars/')) {
    const carId = firebasePath.split('/')[1];
    return {
      bucket: STORAGE_BUCKETS.CAR_IMAGES,
      path: `${carId}/car_image.jpg`
    };
  }
  
  // Fallback
  return {
    bucket: STORAGE_BUCKETS.USER_DOCUMENTS,
    path: firebasePath
  };
};

export default {
  uploadProfileImage,
  uploadUserDocument,
  uploadCarImage,
  getDocumentSignedUrl,
  deleteStorageFile,
  convertFirebasePathToSupabase,
  STORAGE_BUCKETS
};
