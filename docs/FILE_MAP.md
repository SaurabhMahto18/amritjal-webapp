# Source file map

This index helps you locate the implementation to change. All application source files are included in the ZIP; `node_modules`, build output, Git internals and local secrets are excluded.

## src/App.jsx
- `src/App.jsx`

## src/app/AppLayout.jsx
- `src/app/AppLayout.jsx`

## src/app/navigation.js
- `src/app/navigation.js`

## src/app/providers.jsx
- `src/app/providers.jsx`

## src/app/router.jsx
- `src/app/router.jsx`

## src/components/common
- `src/components/common/ConfirmDialog.jsx`
- `src/components/common/DataTable.jsx`
- `src/components/common/DateRangePicker.jsx`
- `src/components/common/EmptyState.jsx`
- `src/components/common/ErrorState.jsx`
- `src/components/common/FormField.jsx`
- `src/components/common/LanguageToggle.jsx`
- `src/components/common/LoadingState.jsx`
- `src/components/common/PageHeader.jsx`
- `src/components/common/Pagination.jsx`
- `src/components/common/PermissionGate.jsx`
- `src/components/common/StatCard.jsx`
- `src/components/common/StatusBadge.jsx`

## src/components/layout
- `src/components/layout/AppShell.jsx`
- `src/components/layout/MobileNavigation.jsx`
- `src/components/layout/Sidebar.jsx`
- `src/components/layout/Topbar.jsx`

## src/features/auth
- `src/features/auth/components/ProtectedRoute.jsx`
- `src/features/auth/hooks/useAuth.js`
- `src/features/auth/pages/LoginPage.jsx`
- `src/features/auth/pages/ResetPasswordPage.jsx`
- `src/features/auth/pages/SignupPage.jsx`
- `src/features/auth/providers/AuthProvider.jsx`
- `src/features/auth/services/authService.js`

## src/features/customer-portal
- `src/features/customer-portal/.gitkeep`

## src/features/customers
- `src/features/customers/components/CustomerDeliveryHistory.jsx`
- `src/features/customers/components/CustomerForm.jsx`
- `src/features/customers/components/CustomerInvoiceList.jsx`
- `src/features/customers/components/CustomerLedgerTable.jsx`
- `src/features/customers/components/CustomerPaymentHistory.jsx`
- `src/features/customers/components/CustomerSummaryCards.jsx`
- `src/features/customers/components/CustomerTabs.jsx`
- `src/features/customers/hooks/useCustomers.js`
- `src/features/customers/pages/CustomerCreatePage.jsx`
- `src/features/customers/pages/CustomerDetailPage.jsx`
- `src/features/customers/pages/CustomerEditPage.jsx`
- `src/features/customers/pages/CustomersPage.jsx`
- `src/features/customers/schemas/customerSchema.js`
- `src/features/customers/services/customerService.js`

## src/features/dashboard
- `src/features/dashboard/components/RevenueSummary.jsx`
- `src/features/dashboard/components/TodayDeliverySummary.jsx`
- `src/features/dashboard/pages/DashboardPage.jsx`
- `src/features/dashboard/services/dashboardService.js`

## src/features/deliveries
- `src/features/deliveries/components/DeliveryBulkEntry.jsx`
- `src/features/deliveries/components/DeliveryFilters.jsx`
- `src/features/deliveries/components/DeliveryForm.jsx`
- `src/features/deliveries/hooks/useDeliveries.js`
- `src/features/deliveries/pages/DeliveriesPage.jsx`
- `src/features/deliveries/pages/DeliveryCreatePage.jsx`
- `src/features/deliveries/services/deliveryService.js`

## src/features/employees
- `src/features/employees/components/EmployeeForm.jsx`
- `src/features/employees/components/EmployeePermissions.jsx`
- `src/features/employees/pages/EmployeeCreatePage.jsx`
- `src/features/employees/pages/EmployeeDetailPage.jsx`
- `src/features/employees/pages/EmployeeWalletPage.jsx`
- `src/features/employees/pages/EmployeesPage.jsx`
- `src/features/employees/services/employeeService.js`
- `src/features/employees/services/employeeWalletService.js`

## src/features/expenses
- `src/features/expenses/components/ExpenseForm.jsx`
- `src/features/expenses/pages/ExpenseCreatePage.jsx`
- `src/features/expenses/pages/ExpensesPage.jsx`
- `src/features/expenses/services/expenseService.js`

## src/features/imports
- `src/features/imports/components/ColumnMappingStep.jsx`
- `src/features/imports/components/FileUploadStep.jsx`
- `src/features/imports/components/ImportErrorReport.jsx`
- `src/features/imports/components/ImportPreviewTable.jsx`
- `src/features/imports/components/ReconciliationPanel.jsx`
- `src/features/imports/pages/MonthlyImportPage.jsx`
- `src/features/imports/services/csvParser.js`
- `src/features/imports/services/importService.js`
- `src/features/imports/services/importValidation.js`
- `src/features/imports/services/xlsxParser.js`

## src/features/invoices
- `src/features/invoices/components/InvoiceForm.jsx`
- `src/features/invoices/components/InvoicePaymentForm.jsx`
- `src/features/invoices/components/InvoicePreview.jsx`
- `src/features/invoices/components/InvoiceStatusBadge.jsx`
- `src/features/invoices/pages/CreateInvoicePage.jsx`
- `src/features/invoices/pages/InvoiceDetailPage.jsx`
- `src/features/invoices/pages/InvoiceListPage.jsx`
- `src/features/invoices/pages/InvoicePrintPage.jsx`
- `src/features/invoices/pages/InvoicesPage.jsx`
- `src/features/invoices/print/ReportStyleInvoicePrint.jsx`
- `src/features/invoices/print/StandardInvoicePrint.jsx`
- `src/features/invoices/print/SummaryInvoicePrint.jsx`
- `src/features/invoices/print/ThermalInvoicePrint.jsx`
- `src/features/invoices/services/invoicePaymentHistoryService.js`
- `src/features/invoices/services/invoicePaymentService.js`
- `src/features/invoices/services/invoiceService.js`
- `src/features/invoices/services/invoiceValidation.js`
- `src/features/invoices/services/pdfService.js`
- `src/features/invoices/utils/invoiceConstants.js`
- `src/features/invoices/utils/invoiceUtils.js`

## src/features/jars
- `src/features/jars/components/JarTransactionForm.jsx`
- `src/features/jars/pages/JarManagementPage.jsx`
- `src/features/jars/services/jarService.js`

## src/features/ledger
- `src/features/ledger/components/CustomerLedgerStatement.jsx`
- `src/features/ledger/components/LedgerFilters.jsx`
- `src/features/ledger/components/LedgerSummaryCards.jsx`
- `src/features/ledger/components/LedgerTable.jsx`
- `src/features/ledger/components/LedgerTransactionsTable.jsx`
- `src/features/ledger/pages/LedgerPage.jsx`
- `src/features/ledger/services/ledgerService.js`

## src/features/notifications
- `src/features/notifications/.gitkeep`

## src/features/offline
- `src/features/offline/.gitkeep`

## src/features/payments
- `src/features/payments/components/PaymentForm.jsx`
- `src/features/payments/components/PaymentReceipt.jsx`
- `src/features/payments/hooks/usePayments.js`
- `src/features/payments/pages/PaymentCreatePage.jsx`
- `src/features/payments/pages/PaymentsPage.jsx`
- `src/features/payments/services/paymentService.js`

## src/features/products
- `src/features/products/components/ProductForm.jsx`
- `src/features/products/pages/ProductsPage.jsx`
- `src/features/products/services/productService.js`

## src/features/reports
- `src/features/reports/components/ReportFilters.jsx`
- `src/features/reports/pages/ReportsPage.jsx`
- `src/features/reports/services/reportService.js`

## src/features/routes
- `src/features/routes/components/RouteCustomerAssignment.jsx`
- `src/features/routes/components/RouteForm.jsx`
- `src/features/routes/pages/RoutesPage.jsx`
- `src/features/routes/services/routeService.js`

## src/features/settings
- `src/features/settings/components/AgencyLocationForm.jsx`
- `src/features/settings/components/BankDetailsForm.jsx`
- `src/features/settings/components/BillingSettingsForm.jsx`
- `src/features/settings/components/BusinessProfileForm.jsx`
- `src/features/settings/components/InvoicePaymentSettingsForm.jsx`
- `src/features/settings/components/UPIDetailsForm.jsx`
- `src/features/settings/components/UpdatePasswordForm.jsx`
- `src/features/settings/components/UserProfileForm.jsx`
- `src/features/settings/components/WalletAmountForm.jsx`
- `src/features/settings/pages/SettingsPage.jsx`
- `src/features/settings/services/settingsService.js`

## src/features/subscriptions
- `src/features/subscriptions/pages/.gitkeep`

## src/features/whatsapp
- `src/features/whatsapp/components/MessageComposer.jsx`
- `src/features/whatsapp/components/MessageStatusTable.jsx`
- `src/features/whatsapp/pages/WhatsAppCenterPage.jsx`
- `src/features/whatsapp/services/whatsappService.js`

## src/i18n/index.js
- `src/i18n/index.js`

## src/i18n/locales
- `src/i18n/locales/en.json`
- `src/i18n/locales/hi.json`

## src/index.css
- `src/index.css`

## src/lib/constants
- `src/lib/constants/statuses.js`
- `src/lib/constants/transactionTypes.js`

## src/lib/errors
- `src/lib/errors/appError.js`

## src/lib/format
- `src/lib/format/currency.js`
- `src/lib/format/date.js`

## src/lib/permissions
- `src/lib/permissions/permissions.js`

## src/lib/supabase
- `src/lib/supabase/client.js`
- `src/lib/supabase/database.types.js`
- `src/lib/supabase/testConnection.js`

## src/lib/supabase.js
- `src/lib/supabase.js`

## src/lib/validation
- `src/lib/validation/index.js`

## src/main.jsx
- `src/main.jsx`

## src/services/auditService.js
- `src/services/auditService.js`

## src/services/storageService.js
- `src/services/storageService.js`

## src/styles/global.css
- `src/styles/global.css`

## src/styles/layout.css
- `src/styles/layout.css`

## src/styles/tokens.css
- `src/styles/tokens.css`
