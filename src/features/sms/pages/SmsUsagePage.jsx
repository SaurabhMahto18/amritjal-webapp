import SmsTabs from "../components/SmsTabs";

export default function SmsUsagePage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      

      <SmsTabs
        activeTab="usage"
        onChange={(tab) => {
          if (tab === "settings") {
            window.location.href = "/sms";
          }
        }}
      />

      <div className="rounded-xl border border-gray-200 bg-white p-8">
        <h2 className="text-lg font-semibold text-gray-900">
          SMS Usage
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          SMS usage reports abhi configured nahi hain.
          Provider integration aur usage logging connect hone ke baad
          sent messages, failed messages aur total usage yahan dikhega.
        </p>
      </div>
    </div>
  );
}