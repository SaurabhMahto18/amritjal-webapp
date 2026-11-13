import { useEffect, useState } from "react";

import SmsTabs from "../components/SmsTabs";
import SmsFilters from "../components/SmsFilters";
import CustomerList from "../components/CustomerList";
import SmsSettingsPanel from "../components/SmsSettingsPanel";
import SmsWarning from "../components/SmsWarning";

import { useSmsCustomers } from "../hooks/useSmsCustomers";
import { useSmsSettings } from "../hooks/useSmsSettings";

export default function SmsSettingsPage() {
  const [activeTab, setActiveTab] = useState("settings");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const {
    customers,
    groups,
    filters,
    page,
    totalPages,
    totalCustomers,
    loading: customersLoading,
    error: customersError,
    updateFilter,
    resetFilters,
    changePage,
  } = useSmsCustomers();

  const {
    settings,
    reminder,
    loading: settingsLoading,
    saving,
    error: settingsError,
    success,
    updateSettings,
    updateReminder,
    saveSettings,
  } = useSmsSettings(selectedCustomer?.id);

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
  };

  const handleSave = async () => {
    await saveSettings();
  };

  useEffect(() => {
  document.title = "SMS Settings | Amrit Jal";

  const setMeta = (name, content) => {
    let meta = document.querySelector(`meta[name="${name}"]`);

    if (!meta) {
      meta = document.createElement("meta");
      meta.name = name;
      document.head.appendChild(meta);
    }

    meta.content = content;
  };

  setMeta(
    "description",
    "Manage customer-wise SMS and WhatsApp notifications, delivery alerts, payment messages and automated payment reminders in Amrit Jal."
  );

  setMeta("robots", "noindex, nofollow");

  return () => {
    document.title = "Amrit Jal";
  };
}, []);

  return (
    <div className="space-y-6 p-4 md:p-6">
     

      <SmsTabs
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "settings" && (
        <>
          <SmsFilters
            filters={filters}
            groups={groups}
            onChange={updateFilter}
            onSearch={() => changePage(1)}
            onReset={resetFilters}
          />

          {customersError && (
            <SmsWarning type="error">
              {customersError}
            </SmsWarning>
          )}

          {settingsError && (
            <SmsWarning type="error">
              {settingsError}
            </SmsWarning>
          )}

          {success && (
            <SmsWarning type="success">
              SMS settings successfully save ho gayi hain.
            </SmsWarning>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
            <CustomerList
              customers={customers}
              selectedCustomerId={selectedCustomer?.id}
              onSelect={handleCustomerSelect}
              page={page}
              totalPages={totalPages}
              totalCustomers={totalCustomers}
              onPageChange={changePage}
              loading={customersLoading}
            />

            <div className="min-w-0">
              {selectedCustomer ? (
                settingsLoading ? (
                  <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
                    Loading customer settings...
                  </div>
                ) : (
                  <SmsSettingsPanel
                    customer={selectedCustomer}
                    settings={settings}
                    reminder={reminder}
                    onSettingsChange={updateSettings}
                    onReminderChange={updateReminder}
                    onSave={handleSave}
                    saving={saving}
                  />
                )
              ) : (
                <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
                  <div>
                    <div className="mb-3 text-3xl">💬</div>
                    <h3 className="font-semibold text-gray-800">
                      Select a Customer
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Customer select karne par SMS configuration yahan dikhegi.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === "usage" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            SMS Usage
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Usage statistics aur message delivery reports yahan show hongi.
          </p>
        </div>
      )}
    </div>
  );
}