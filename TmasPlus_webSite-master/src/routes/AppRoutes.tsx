import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";

// Páginas
import UsersPage from "@/pages/Users/UsersPage";
import CorporateBookingsPage from "@/pages/Bookings/CorporateBookingsPage";
import LoginPage from "@/pages/Auth/LoginPage";
import HomePage from "@/pages/Home/HomePage";
import ShiftChangerPage from "@/pages/ShiftChanger/ShiftChangerPage";
import BookingDetailsPage from "@/pages/BookingDetails/BookingDetailsPage";
import CompanyBillingPage from "@/pages/Billing/CompanyBillingPage";
import BookingHistoryPage from "@/pages/BookingHistory/BookingHistoryPage";
import AddBookingPage from "@/pages/AddBooking/AddBookingPage";
import OfficialsViewPage from "@/pages/Officials/OfficialsViewPage";
import ComplaintsViewPage from "@/pages/Complaints/ComplaintsViewPage";
import OffersPage from "@/pages/Offers/OffersPage";
import ContractsPage from "@/pages/Contracts/ContractsPage";
import ProfilePage from "@/pages/Profile/ProfilePage";
import SettingsPage from "@/pages/Settings/SettingsPage";
import TollsPage from "@/pages/Tolls/TollsPage";
import NotificationsPage from "@/pages/Notifications/NotificationsPage";
import DocumentUpload from "@/pages/Users/DocumentUpload/DocumentUpload";

// Placeholders rápidos (reemplaza por tus páginas reales)
const NotFound = () => <div className="p-6"><h1 className="text-2xl font-semibold">404 — No encontrado</h1></div>;

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/document-upload" element={<DocumentUpload />} />

      {/* Redirige raíz a /home */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Layout principal */}
      <Route element={<DashboardLayout />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/shiftchanger" element={<ShiftChangerPage />} />
        <Route path="/bookingHistory" element={<BookingHistoryPage />} />
        <Route path="/addbooking" element={<AddBookingPage />} />
        <Route path="/bookingCorp" element={<CorporateBookingsPage />} />
        <Route path="/bookingdetails" element={<BookingDetailsPage />} />
        <Route path="/billing" element={<CompanyBillingPage />} />
        <Route path="/users/*" element={<UsersPage />} />
        <Route path="/officialview" element={<OfficialsViewPage />} />
        <Route path="/complaints" element={<ComplaintsViewPage />} />
        <Route path="/treasoffers" element={<OffersPage /> } />
        <Route path="/contracts" element={<ContractsPage /> } />
        <Route path="/userprofile" element={<ProfilePage /> } />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/tolls" element={<TollsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        {/* agrega aquí: /bookingHistory, /addbooking, /billingmodule, etc. */}
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
