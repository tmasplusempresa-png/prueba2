import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useSearchParams } from "react-router-dom";

import DocumentUploadForm from "./DocumentUploadForm";

type UploadedDocs = Record<string, File[]>;

const DocumentUpload: React.FC = () => {
  const [files, setFiles] = useState<UploadedDocs>({});
  const [searchParams] = useSearchParams();
  const profile = searchParams.get("profile");

  if (!profile) {
    return (
      <div className="p-4 text-sm text-red-600">
        No se pudo determinar el tipo de perfil para la carga de documentos.
      </div>
    );
  }

  function handleFinish() {
    console.log("Documentos cargados:", files);
    alert("Documentos cargados correctamente");
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <header>
          <h1 className="text-lg font-semibold text-slate-800">
            Sube tus documentos
          </h1>
          <p className="text-xs text-slate-500">
            Usa la cámara de tu celular o sube archivos existentes.
          </p>
        </header>

        <DocumentUploadForm profile={profile} />

        <Button onClick={handleFinish} className="w-full">
          Finalizar carga de documentos
        </Button>
      </div>
    </div>
  );
};

export default DocumentUpload;
