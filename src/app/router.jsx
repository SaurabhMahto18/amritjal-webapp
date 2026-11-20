
import {
  BrowserRouter,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";

// ========================================
// PWA INSTALL PROMPT
// ========================================

import PWAInstallPrompt from "../components/PWAInstallPrompt";

// ========================================
// PLATFORM ADMIN
// ========================================

import AdminLogin from "../features/admin/pages/AdminLogin";
import AdminDashboard from "../features/admin/pages/AdminDashboard";
import AdminLayout from "../features/admin/components/AdminLayout";
import ProtectedAdminRoute from "../features/admin/components/ProtectedAdminRoute";
import AdminBusinesses from "../features/admin/pages/AdminBusinesses";
import AdminSubscriptions from "../features/admin/pages/AdminSubscriptions";
import AdminSettings from "../features/admin/pages/AdminSettings";
import AdminBusinessDetails from "../features/admin/pages/AdminBusinessDetails";
import AdminRevenue from "../features/admin/pages/AdminRevenue";
import AdminPaymentEntry from "../features/admin/pages/AdminPaymentEntry";
import AdminPlans from "../features/admin/pages/AdminPlans";
import AdminRenewals from "../features/admin/pages/AdminRenewals";
import AdminSupport from "../features/admin/pages/AdminSupport";
import AdminActivityLogs from "../features/admin/pages/AdminActivityLogs";
import AdminUsers from "../features/admin/pages/AdminUsers";
import AdminConfiguration from "../features/admin/pages/AdminConfiguration";
import AdminAnnouncements from "../features/admin/pages/AdminAnnouncements";
import RegistrationRequestsPage from "../features/admin/pages/RegistrationRequestsPage";

// ========================================
// AUTHENTICATION
// ========================================

import LoginPage from "../features/auth/pages/LoginPage";
import SignupPage from "../features/auth/pages/SignupPage";
import ResetPasswordPage from "../features/auth/pages/ResetPasswordPage";
import ProtectedRoute from "../features/auth/components/ProtectedRoute";

// ========================================
// PUBLIC LANDING
// ========================================

import LandingPage from "../features/landing/pages/LandingPage";
import PrivacyPolicyPage from "../features/landing/pages/PrivacyPolicyPage";
import TermsPage from "../features/landing/pages/TermsPage";

// ========================================
// PUBLIC TOOLS
// ========================================

import ToolsPage from "../features/landing/pages/ToolsPage";
import ToolCalculatorPage from "../features/landing/pages/ToolCalculatorPage";

// ========================================
// APPLICATION LAYOUT
// ========================================

import AppLayout from "./AppLayout";

// ========================================
// BUSINESS ANNOUNCEMENTS
// ========================================

import BusinessAnnouncementsPage from "../features/announcements/pages/BusinessAnnouncementsPage";

// ========================================
// DASHBOARD
// ========================================

import DashboardPage from "../features/dashboard/pages/DashboardPage";

// ========================================
// CUSTOMERS
// ========================================

import CustomersPage from "../features/customers/pages/CustomersPage";
import CustomerCreatePage from "../features/customers/pages/CustomerCreatePage";
import CustomerEditPage from "../features/customers/pages/CustomerEditPage";
import CustomerDetailPage from "../features/customers/pages/CustomerDetailPage";
import BulkCustomerImportPage from "../features/customers/pages/BulkCustomerImportPage";

// ========================================
// DELIVERIES
// ========================================

import DeliveriesPage from "../features/deliveries/pages/DeliveriesPage";
import DeliveryCreatePage from "../features/deliveries/pages/DeliveryCreatePage";
import BulkDeliveryPage from "../features/deliveries/pages/BulkDeliveryPage";

// ========================================
// PRODUCTS
// ========================================

import ProductsPage from "../features/products/pages/ProductsPage";
import ProductDetailPage from "../features/products/pages/ProductDetailPage";

// ========================================
// INVOICES
// ========================================

import InvoicesPage from "../features/invoices/pages/InvoicesPage";
import CreateInvoicePage from "../features/invoices/pages/CreateInvoicePage";
import InvoiceDetailPage from "../features/invoices/pages/InvoiceDetailPage";
import ReportStyleInvoicePrint from "../features/invoices/print/ReportStyleInvoicePrint";
import SummaryInvoicePrint from "../features/invoices/print/SummaryInvoicePrint";
import StandardInvoicePrint from "../features/invoices/print/StandardInvoicePrint";
import ThermalInvoicePrint from "../features/invoices/print/ThermalInvoicePrint";

// ========================================
// FINANCE
// ========================================

import LedgerPage from "../features/ledger/pages/LedgerPage";
import PaymentsPage from "../features/payments/pages/PaymentsPage";
import PaymentCreatePage from "../features/payments/pages/PaymentCreatePage";
import ExpensesPage from "../features/expenses/pages/ExpensesPage";
import ExpenseCreatePage from "../features/expenses/pages/ExpenseCreatePage";

// ========================================
// SUBSCRIPTION
// ========================================

import PublicSubscriptionPage from "../features/subscription/pages/PublicSubscriptionPage";
import SubscriptionCheckoutPage from "../features/subscription/pages/SubscriptionCheckoutPage";
import SubscriptionPaymentSubmissionPage from "../features/subscription/pages/SubscriptionPaymentSubmissionPage";
import SubscriptionPaymentStatusPage from "../features/subscription/pages/SubscriptionPaymentStatusPage";
import SubscriptionHistoryPage from "../features/subscription/pages/SubscriptionHistoryPage";
import MySubscriptionPage from "../features/subscription/pages/MySubscriptionPage";
import SubscriptionUpgradePage from "../features/subscription/pages/SubscriptionUpgradePage";

// ========================================
// JARS AND IMPORTS
// ========================================

import JarManagementPage from "../features/jars/pages/JarManagementPage";
import MonthlyImportPage from "../features/imports/pages/MonthlyImportPage";

// ========================================
// SETTINGS
// ========================================

import SettingsPage from "../features/settings/pages/SettingsPage";

// ========================================
// EMPLOYEES
// ========================================

import EmployeesPage from "../features/employees/pages/EmployeesPage";
import EmployeeDetailPage from "../features/employees/pages/EmployeeDetailPage";

// ========================================
// ROUTES AND WHATSAPP
// ========================================

import RoutesPage from "../features/routes/pages/RoutesPage";
import WhatsAppCenterPage from "../features/whatsapp/pages/WhatsAppCenterPage";

// ========================================
// REPORTS
// ========================================

import ReportsPage from "../features/reports/pages/ReportsPage";

// ========================================
// CUSTOMER GROUPS
// ========================================

import GroupsPage from "../features/groups/pages/GroupsPage";
import GroupCreatePage from "../features/groups/pages/GroupCreatePage";
import GroupDetailPage from "../features/groups/pages/GroupDetailPage";

// ========================================
// WALLET
// ========================================

import WalletTransactionsPage from "../features/wallet/pages/WalletTransactionsPage";

// ========================================
// SMS
// ========================================

import SmsSettingsPage from "../features/sms/pages/SmsSettingsPage";

// ========================================
// EVENTS
// ========================================

import EventsPage from "../features/events/pages/EventsPage";
import EventDetailsPage from "../features/events/pages/EventDetailsPage";

// ========================================
// PLACEHOLDER PAGE
// ========================================

function PlaceholderPage({ title, description }) {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 p-6 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-700">
            Amrit Jal Module
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            {title}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {description || "This module is under development."}
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
            Module development pending
          </div>
        </div>
      </div>
    </main>
  );
}

// ========================================
// APP ROUTER
// ========================================

export default function AppRouter() {
  return (
    <BrowserRouter>

      {/* Global PWA install prompt.
          Must stay outside Routes. */}

      <PWAInstallPrompt />

      <Routes>

        {/* =====================================
            PLATFORM ADMIN
        ===================================== */}

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        <Route element={<ProtectedAdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>

            <Route
              index
              element={<Navigate to="/admin/dashboard" replace />}
            />

            <Route
              path="dashboard"
              element={<AdminDashboard />}
            />

            <Route
              path="businesses"
              element={<AdminBusinesses />}
            />

            <Route
              path="businesses/:businessId"
              element={<AdminBusinessDetails />}
            />

            <Route
              path="subscriptions"
              element={<AdminSubscriptions />}
            />

            <Route
              path="settings"
              element={<AdminSettings />}
            />

            <Route
              path="revenue"
              element={<AdminRevenue />}
            />

            <Route
              path="revenue/new"
              element={<AdminPaymentEntry />}
            />

            <Route
              path="plans"
              element={<AdminPlans />}
            />

            <Route
              path="renewals"
              element={<AdminRenewals />}
            />

            <Route
              path="support-tickets"
              element={<AdminSupport />}
            />

            <Route
              path="activity-logs"
              element={<AdminActivityLogs />}
            />

            <Route
              path="users"
              element={<AdminUsers />}
            />

            <Route
              path="configuration"
              element={<AdminConfiguration />}
            />

            <Route
              path="announcements"
              element={<AdminAnnouncements />}
            />

            <Route
              path="registration-requests"
              element={<RegistrationRequestsPage />}
            />

          </Route>
        </Route>

        {/* =====================================
            PUBLIC ROUTES
        ===================================== */}

        <Route
          path="/"
          element={<LandingPage />}
        />

        <Route
          path="/privacy-policy"
          element={<PrivacyPolicyPage />}
        />

        <Route
          path="/terms"
          element={<TermsPage />}
        />

        {/* Free Tools */}

        <Route
          path="/tools"
          element={<ToolsPage />}
        />

        <Route
          path="/tools/:toolId"
          element={<ToolCalculatorPage />}
        />

        {/* Blog */}

        <Route
          path="/blog"
          element={
            <PlaceholderPage
              title="Amrit Jal Blog"
              description="Water delivery business tips, water management guides and industry updates."
            />
          }
        />

        <Route
          path="/blog/:slug"
          element={
            <PlaceholderPage
              title="Blog Article"
              description="The requested blog article will be available here."
            />
          }
        />

        {/* =====================================
            AUTHENTICATION
        ===================================== */}

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/signup"
          element={<SignupPage />}
        />

        <Route
          path="/reset-password"
          element={<ResetPasswordPage />}
        />

        {/* =====================================
            PROTECTED BUSINESS APPLICATION
        ===================================== */}

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>

            {/* Dashboard */}

            <Route
              path="/dashboard"
              element={<DashboardPage />}
            />

            {/* =====================================
                CUSTOMER MANAGEMENT
            ===================================== */}

            <Route
              path="/customers"
              element={<CustomersPage />}
            />

            <Route
              path="/customers/new"
              element={<CustomerCreatePage />}
            />

            <Route
              path="/customers/import"
              element={<BulkCustomerImportPage />}
            />

            <Route
              path="/customers/:customerId"
              element={<CustomerDetailPage />}
            />

            <Route
              path="/customers/:customerId/edit"
              element={<CustomerEditPage />}
            />

            {/* Customer Groups */}

            <Route
              path="/groups"
              element={<GroupsPage />}
            />

            <Route
              path="/groups/new"
              element={<GroupCreatePage />}
            />

            <Route
              path="/groups/:id"
              element={<GroupDetailPage />}
            />

            {/* =====================================
                OPERATIONS
            ===================================== */}

            {/* Deliveries */}

            <Route
              path="/deliveries"
              element={<DeliveriesPage />}
            />

            <Route
              path="/deliveries/new"
              element={<DeliveryCreatePage />}
            />

            <Route
              path="/deliveries/bulk"
              element={<BulkDeliveryPage />}
            />

            {/* Events */}

            <Route
              path="/events"
              element={<EventsPage />}
            />

            <Route
              path="/events/:eventId"
              element={<EventDetailsPage />}
            />

            {/* Load / Unload */}

            <Route
              path="/load-unload"
              element={
                <PlaceholderPage title="Load / Unload Management" />
              }
            />

            {/* Route Management */}

            <Route
              path="/routes"
              element={<RoutesPage />}
            />

            {/* Products */}

            <Route
              path="/products"
              element={<ProductsPage />}
            />

            <Route
              path="/products/:productId"
              element={<ProductDetailPage />}
            />

            {/* Jar Management */}

            <Route
              path="/jars"
              element={<JarManagementPage />}
            />

            {/* Monthly Import */}

            <Route
              path="/imports/monthly"
              element={<MonthlyImportPage />}
            />

            {/* =====================================
                PAYMENTS & BILLING
            ===================================== */}

            <Route
              path="/payments"
              element={<PaymentsPage />}
            />

            <Route
              path="/payments/new"
              element={<PaymentCreatePage />}
            />

            <Route
              path="/employee-payments"
              element={
                <PlaceholderPage title="Employee Payments" />
              }
            />

            <Route
              path="/ledger"
              element={<LedgerPage />}
            />

            {/* Subscription */}

            <Route
              path="/subscription"
              element={<PublicSubscriptionPage />}
            />

            <Route
              path="/subscription/checkout"
              element={<SubscriptionCheckoutPage />}
            />

            <Route
              path="/subscription/payment-submission"
              element={<SubscriptionPaymentSubmissionPage />}
            />

            <Route
              path="/subscription/payment-status"
              element={<SubscriptionPaymentStatusPage />}
            />

            <Route
              path="/subscription/history"
              element={<SubscriptionHistoryPage />}
            />

            <Route
              path="/subscription/my-plan"
              element={<MySubscriptionPage />}
            />

            <Route
              path="/subscription/upgrade"
              element={<SubscriptionUpgradePage />}
            />

            {/* Invoices */}

            <Route
              path="/invoices"
              element={<InvoicesPage />}
            />

            <Route
              path="/invoices/new"
              element={<CreateInvoicePage />}
            />

            <Route
              path="/invoices/:invoiceId"
              element={<InvoiceDetailPage />}
            />

            {/* Invoice Printing */}

            <Route
              path="/invoices/:invoiceId/print/summary"
              element={<SummaryInvoicePrint />}
            />

            <Route
              path="/invoices/:invoiceId/print/standard"
              element={<StandardInvoicePrint />}
            />

            <Route
              path="/invoices/:invoiceId/print/thermal"
              element={<ThermalInvoicePrint />}
            />

            <Route
              path="/invoices/:invoiceId/print/report"
              element={<ReportStyleInvoicePrint />}
            />

            {/* Expenses */}

            <Route
              path="/expenses"
              element={<ExpensesPage />}
            />

            <Route
              path="/expenses/new"
              element={<ExpenseCreatePage />}
            />

            {/* Wallet Transactions */}

            <Route
              path="/wallet-transactions"
              element={<WalletTransactionsPage />}
            />

            {/* Monthly Card */}

            <Route
              path="/monthly-card"
              element={
                <PlaceholderPage title="Monthly Card" />
              }
            />

            {/* =====================================
                TEAM MANAGEMENT
            ===================================== */}

            <Route
              path="/employees"
              element={<EmployeesPage />}
            />

            <Route
              path="/employees/:employeeId"
              element={<EmployeeDetailPage />}
            />

            <Route
              path="/employees/:employeeId/edit"
              element={<EmployeeDetailPage />}
            />

            {/* Employee Leaves */}

            <Route
              path="/leaves"
              element={
                <PlaceholderPage title="Employee Leaves" />
              }
            />

            {/* =====================================
                REPORTS & ANALYTICS
            ===================================== */}

            <Route
              path="/reports"
              element={<ReportsPage />}
            />

            <Route
              path="/reports/bulk"
              element={
                <PlaceholderPage title="Bulk Reports" />
              }
            />

            {/* =====================================
                COMMUNICATION
            ===================================== */}

            <Route
              path="/sms"
              element={<SmsSettingsPage />}
            />

            <Route
              path="/whatsapp"
              element={<WhatsAppCenterPage />}
            />

            {/* Business Announcements */}

            <Route
              path="/announcements"
              element={<BusinessAnnouncementsPage />}
            />

            {/* =====================================
                MY SHOP / SETTINGS
            ===================================== */}

            <Route
              path="/settings"
              element={<SettingsPage />}
            />

          </Route>
        </Route>

        {/* =====================================
            UNKNOWN ROUTES
        ===================================== */}

        <Route
          path="*"
          element={
            <PlaceholderPage
              title="Page Not Found"
              description="The requested page could not be found."
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}
