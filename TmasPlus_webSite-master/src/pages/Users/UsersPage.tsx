import React, { useMemo, useReducer, useState } from "react";
import { useUsers, type User, type UserType } from "@/hooks/useUsers";
import { useDebounced } from "@/hooks/useDebounced";
import { formatDate } from "@/utils/formatDate";
import { Page } from "@/components/layout/Page";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { classNames } from "@/utils/classNames";
import AddUserModal from "./AddUserModal";
import DriverDocumentsModal from "./DriverDocumentsModal";
import { FileText } from "lucide-react";

type UsersState = {
  query: string;
  userType: UserType;
  page: number;
  pageSize: number;
};

type UsersAction =
  | { type: "query"; value: string }
  | { type: "userType"; value: UserType }
  | { type: "page"; value: number };

function usersReducer(state: UsersState, action: UsersAction): UsersState {
  switch (action.type) {
    case "query":
      return { ...state, query: action.value, page: 1 };
    case "userType":
      return { ...state, userType: action.value, page: 1 };
    case "page":
      return { ...state, page: action.value };
    default:
      return state;
  }
}

export const UsersPage: React.FC = () => {
  const [state, dispatch] = useReducer(usersReducer, {
    query: "",
    userType: "all",
    page: 1,
    pageSize: 10,
  });

  const debouncedQuery = useDebounced(state.query);
  const [openAdd, setOpenAdd] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<User | null>(null);
  const [openDriverDocs, setOpenDriverDocs] = useState(false);
  
  // Obtener usuarios desde Supabase
  const { users, loading, error, refreshUsers } = useUsers(state.userType);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return users.filter((u) => {
      const matchesQuery = q
        ? [
            u.first_name,
            u.last_name,
            u.email,
            u.mobile,
            u.id,
          ].some((v) => v?.toLowerCase().includes(q))
        : true;
      return matchesQuery;
    });
  }, [debouncedQuery, users]);

  // Columnas para conductores - incluyen placa y referral_id
  const driverColumns: Column<User>[] = [
    { header: "ID", accessor: (r) => r.id.substring(0, 8) + "...", width: "w-20" },
    { 
      header: "Nombre", 
      accessor: (r) => `${r.first_name} ${r.last_name}`.trim() || "Sin nombre", 
      width: "w-48" 
    },
    { header: "Correo", accessor: (r) => r.email || "Sin correo", width: "w-52" },
    { header: "Teléfono", accessor: (r) => r.mobile || "Sin teléfono", width: "w-32" },
    {
      header: "Placa",
      accessor: (r) => (
        <button
          onClick={() => {
            setSelectedDriver(r);
            setOpenDriverDocs(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-mono text-sm font-semibold"
          title="Ver documentos del conductor"
        >
          <FileText className="w-3.5 h-3.5" />
          {r.license_number || "Sin placa"}
        </button>
      ),
      width: "w-32",
    },
    {
      header: "Referido",
      accessor: (r) => (
        <span className="text-sm text-slate-600 font-mono">
          {r.referral_id || "-"}
        </span>
      ),
      width: "w-28",
    },
    {
      header: "Estado",
      accessor: (r) => (
        <span
          className={classNames(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs",
            r.approved && !r.blocked && "bg-green-50 text-green-700 border border-green-200",
            !r.approved && "bg-amber-50 text-amber-700 border border-amber-200",
            r.blocked && "bg-red-50 text-red-700 border border-red-200"
          )}
        >
          {r.blocked ? "Bloqueado" : r.approved ? "Activo" : "Pendiente"}
        </span>
      ),
      width: "w-24",
    },
    { 
      header: "Viajes", 
      accessor: (r) => r.total_rides.toString(), 
      width: "w-16" 
    },
  ];

  // Columnas para clientes y admins
  const columns: Column<User>[] = [
    { header: "ID", accessor: (r) => r.id.substring(0, 8) + "...", width: "w-24" },
    { 
      header: "Nombre", 
      accessor: (r) => `${r.first_name} ${r.last_name}`.trim() || "Sin nombre", 
      width: "w-56" 
    },
    { header: "Correo", accessor: (r) => r.email || "Sin correo", width: "w-64" },
    { header: "Teléfono", accessor: (r) => r.mobile || "Sin teléfono", width: "w-40" },
    {
      header: "Tipo",
      accessor: (r) => (
        <span
          className={classNames(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
            r.user_type === "customer" && "bg-blue-50 text-blue-700 border border-blue-200",
            r.user_type === "driver" && "bg-purple-50 text-purple-700 border border-purple-200",
            r.user_type === "admin" && "bg-amber-50 text-amber-700 border border-amber-200"
          )}
        >
          {r.user_type === "customer" ? "Cliente" : r.user_type === "driver" ? "Conductor" : "Admin"}
        </span>
      ),
      width: "w-28",
    },
    {
      header: "Estado",
      accessor: (r) => (
        <span
          className={classNames(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs",
            r.approved && !r.blocked && "bg-green-50 text-green-700 border border-green-200",
            !r.approved && "bg-amber-50 text-amber-700 border border-amber-200",
            r.blocked && "bg-red-50 text-red-700 border border-red-200"
          )}
        >
          {r.blocked ? "Bloqueado" : r.approved ? "Activo" : "Pendiente"}
        </span>
      ),
      width: "w-28",
    },
    { 
      header: "Viajes", 
      accessor: (r) => r.total_rides.toString(), 
      width: "w-20" 
    },
    { 
      header: "Registro", 
      accessor: (r) => formatDate(r.created_at), 
      width: "w-28" 
    },
  ];

  return (
    <Page
      title="Listado de Usuarios"
      actions={
        <>
          <Button onClick={() => setOpenAdd(true)}>Añadir Usuario</Button>
          <Button variant="secondary" onClick={() => refreshUsers()}>
            Actualizar
          </Button>
        </>
      }
    >
      {/* Filtros superiores */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <Tabs
          tabs={[
            { value: "all", label: "Todos" },
            { value: "customer", label: "Clientes" },
            { value: "driver", label: "Conductores" },
            { value: "admin", label: "Administradores" }
          ]}
          value={state.userType}
          onChange={(value) => dispatch({ type: "userType", value: value as UserType })}
        />
        <div className="flex items-center gap-2 w-full md:w-96">
          <Input
            placeholder="Buscar por nombre, email, teléfono..."
            value={state.query}
            onChange={(e) => dispatch({ type: "query", value: e.target.value })}
            aria-label="Buscar usuarios"
          />
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <Card title="Cargando usuarios...">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </Card>
        ) : error ? (
          <Card title="Error">
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">Error al cargar usuarios: {error}</p>
              <Button onClick={() => refreshUsers()}>Reintentar</Button>
            </div>
          </Card>
        ) : (
          <Card 
            title={
              state.userType === "all" 
                ? `Todos los usuarios (${users.length})`
                : state.userType === "customer"
                ? `Clientes (${users.length})`
                : state.userType === "driver"
                ? `Conductores (${users.length})`
                : `Administradores (${users.length})`
            }
          >
            {filtered.length === 0 ? (
              <EmptyState
                title="Sin resultados"
                subtitle={
                  state.query 
                    ? "No se encontraron usuarios con esos criterios de búsqueda."
                    : "No hay usuarios registrados en esta categoría."
                }
                action={<Button onClick={() => setOpenAdd(true)}>Añadir Usuario</Button>}
              />
            ) : (
              <DataTable
                rows={filtered}
                edit={() => setOpenAdd(true)}
                columns={state.userType === "driver" ? driverColumns : columns}
                page={state.page}
                pageSize={state.pageSize}
                onPageChange={(p) => dispatch({ type: "page", value: p })}
              />
            )}
          </Card>
        )}
      </div>
      <AddUserModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSubmit={(payload) => {
          console.log("Guardar:", payload);
          setOpenAdd(false);
          refreshUsers();
        }}
      />
      <DriverDocumentsModal
        driver={selectedDriver}
        open={openDriverDocs}
        onClose={() => {
          setOpenDriverDocs(false);
          setSelectedDriver(null);
        }}
      />
    </Page>
  );
};

export default UsersPage;
