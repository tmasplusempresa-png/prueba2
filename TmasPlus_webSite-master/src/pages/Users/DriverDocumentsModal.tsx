import React from 'react';
import { User } from '@/hooks/useUsers';
import { X, FileText, Image as ImageIcon, Smartphone } from 'lucide-react';

interface DriverDocumentsModalProps {
  driver: User | null;
  open: boolean;
  onClose: () => void;
}

const DocumentImage: React.FC<{ 
  label: string; 
  imageUrl: string | null; 
  alt: string;
}> = ({ label, imageUrl, alt }) => {
  if (!imageUrl) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center bg-slate-50">
          <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
          <p className="text-sm text-slate-500">No disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <img 
          src={imageUrl} 
          alt={alt}
          className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.open(imageUrl, '_blank')}
        />
      </div>
      <button
        onClick={() => window.open(imageUrl, '_blank')}
        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
      >
        <ImageIcon className="w-3 h-3" />
        Ver imagen completa
      </button>
    </div>
  );
};

export const DriverDocumentsModal: React.FC<DriverDocumentsModalProps> = ({
  driver,
  open,
  onClose,
}) => {
  if (!open || !driver) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Documentos del Conductor
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {driver.first_name} {driver.last_name} - {driver.license_number || 'Sin placa'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase">Número de Licencia</label>
                <p className="text-sm font-semibold text-slate-900 mt-1">
                  {driver.license_number || 'No especificado'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase">Plataforma</label>
                <p className="text-sm font-semibold text-slate-900 mt-1">
                  {driver.user_platform || 'No especificado'}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase">ID de Referido</label>
                <p className="text-sm font-semibold text-slate-900 mt-1">
                  {driver.referral_id || 'Sin referido'}
                </p>
              </div>
            </div>

            {/* Documentos de Licencia */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Documentos de Licencia
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DocumentImage
                  label="Licencia de Conducir (Frontal)"
                  imageUrl={driver.license_image}
                  alt="Licencia frontal"
                />
                <DocumentImage
                  label="Licencia de Conducir (Reverso)"
                  imageUrl={driver.license_image_back}
                  alt="Licencia reverso"
                />
              </div>
            </div>

            {/* Documentos del Vehículo */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Documentos del Vehículo
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DocumentImage
                  label="SOAT (Seguro Obligatorio)"
                  imageUrl={driver.soat_image}
                  alt="SOAT"
                />
                <DocumentImage
                  label="Tarjeta de Propiedad (Frontal)"
                  imageUrl={driver.card_prop_image}
                  alt="Tarjeta de propiedad frontal"
                />
                <DocumentImage
                  label="Tarjeta de Propiedad (Reverso)"
                  imageUrl={driver.card_prop_image_bk}
                  alt="Tarjeta de propiedad reverso"
                />
              </div>
            </div>

            {/* Documentos de Identificación */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-600" />
                Documentos de Identificación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DocumentImage
                  label="Documento de Identidad (Frontal)"
                  imageUrl={driver.verify_id_image}
                  alt="ID frontal"
                />
                <DocumentImage
                  label="Documento de Identidad (Reverso)"
                  imageUrl={driver.verify_id_image_bk}
                  alt="ID reverso"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDocumentsModal;
