import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FloatingInput } from "@/components/ui/FloatingField";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "@/assets/Logo-v3.png";
import AddUserModal from "../Users/AddUserModal";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const update = (k: keyof typeof form, v: string) =>
    setForm((s) => ({ ...s, [k]: v }));
  const [openAdd, setOpenAdd] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
        localStorage.setItem("tplus_auth", "ok");
        setLoading(false);
        navigate("/home");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#002f45] to-[#00a7f5]">
      {/* Capa de fondo */}
      <div className="absolute inset-0 bg-[url('/bg-pattern.svg')] bg-cover opacity-10"></div>

      {/* Tarjeta principal */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md bg-white backdrop-blur-md rounded-2xl shadow-xl p-8"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="T+ Logo" className="w-20 h-20 mb-3" />
          <h1 className="text-2xl font-semibold text-[#002f45]">Bienvenido a T+Plus</h1>
          <p className="text-sm text-slate-600">Inicia sesión para continuar</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <FloatingInput
            id="email"
            label="Correo electrónico"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
          <FloatingInput
            id="password"
            label="Contraseña"
            type="password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 select-none">
              <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary" />
              <span className="text-slate-700">Recordarme</span>
            </label>
            <button
              type="button"
              className="text-primary-dark hover:underline"
              onClick={() => alert("Recuperar contraseña")}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 text-lg font-medium"
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </Button>
          <Button
            type="button"
            className="w-full"
            variant="secondary"
            onClick={() => setOpenAdd(true)}
          >
            Registrarse
          </Button>
        </form>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} T+PLUS. Todos los derechos reservados.
        </p>
      </motion.div>
      <AddUserModal
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          onSubmit={(payload) => {
            console.log("Guardar:", payload);
            setOpenAdd(false);
          }}
        />
    </div>
  );
};

export default LoginPage;
