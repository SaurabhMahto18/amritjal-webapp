

import { useEffect, useState } from "react";

import {

  UserRound,

  Phone,

  MapPin,

  Navigation,

  Wallet,

  FileText,

  Save,

  Droplets,

  IndianRupee,
  ArrowLeft,


  AlertCircle,

  CheckCircle2,

  LoaderCircle,

  ShieldCheck,

  Mail,

  Users,

  Clock,

  Bell,

  Copy,

} from "lucide-react";



import { supabase } from "../../../lib/supabase/client";



const initialValues = {

  name: "",

  phone: "",

  billingPhone: "",

  sameBillingPhone: true,

  customerGroupId: "",

  email: "",

  address: "",

  area: "",

  shift: "Morning",

  paymentReminder: "Monthly",

  jarRate: "20",

  openingBalance: "0",

  notes: "",

};



const inputClass =

  "w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent py-3 pl-0 pr-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-0 disabled:cursor-not-allowed disabled:bg-slate-50 sm:rounded-xl sm:border sm:border-slate-200 sm:bg-white sm:py-3 sm:pl-11 sm:pr-4 sm:focus:ring-4 sm:focus:ring-teal-600/10";



const labelClass = "mb-1.5 block text-sm font-medium text-teal-700 sm:mb-2 sm:font-semibold sm:text-slate-700";



function Field({

  label,

  name,

  value,

  onChange,

  placeholder,

  icon: Icon,

  type = "text",

  required = false,

  min,

  step,

  maxLength,

  autoComplete,

  help,

  disabled = false,

}) {

  return (

    <div className="min-w-0">

      <label htmlFor={name} className={labelClass}>

        {label}

        {required && <span className="ml-1 text-rose-500">*</span>}

      </label>



      <div className="relative">

        {Icon && (

          <Icon

            size={17}

            aria-hidden="true"

            className="pointer-events-none absolute left-3.5 top-1/2 hidden -translate-y-1/2 text-slate-400 sm:block"

          />

        )}



        <input

          id={name}

          name={name}

          type={type}

          value={value ?? ""}

          onChange={onChange}

          placeholder={placeholder}

          required={required}

          min={min}

          step={step}

          maxLength={maxLength}

          autoComplete={autoComplete}

          disabled={disabled}

          className={inputClass}

        />

      </div>



      {help && (

        <p className="mt-1.5 text-xs leading-5 text-slate-500">{help}</p>

      )}

    </div>

  );

}



function SelectField({

  label,

  name,

  value,

  onChange,

  icon: Icon,

  options,

  required = false,

  placeholder,

  disabled = false,

}) {

  return (

    <div className="min-w-0">

      <label htmlFor={name} className={labelClass}>

        {label}

        {required && <span className="ml-1 text-rose-500">*</span>}

      </label>



      <div className="relative">

        {Icon && (

          <Icon

            size={17}

            className="pointer-events-none absolute left-3.5 top-1/2 hidden -translate-y-1/2 text-slate-400 sm:block"

          />

        )}



        <select

          id={name}

          name={name}

          value={value}

          onChange={onChange}

          required={required}

          disabled={disabled}

          className={`${inputClass} appearance-none`}

        >

          {placeholder && <option value="">{placeholder}</option>}



          {options.map((option) => (

            <option key={option.value} value={option.value}>

              {option.label}

            </option>

          ))}

        </select>

      </div>

    </div>

  );

}



function SectionHeading({ icon: Icon, title, description }) {

  return (

    <div className="hidden items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-white px-5 py-4 sm:flex sm:px-6">

      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700">

        <Icon size={20} />

      </div>



      <div>

        <h2 className="font-bold text-slate-900">{title}</h2>

        <p className="mt-0.5 text-xs text-slate-500">{description}</p>

      </div>

    </div>

  );

}







export default function CustomerForm({

  initialData,

  onSubmit,

  onCancel,

  submitting = false,

}) {

  const [form, setForm] = useState(() => ({

    ...initialValues,

    ...initialData,

    name: initialData?.name ?? "",

    phone: initialData?.phone ?? "",

    billingPhone: initialData?.billingPhone ?? initialData?.phone ?? "",

    sameBillingPhone:

      initialData?.sameBillingPhone ??

      (!initialData?.billingPhone ||

        initialData.billingPhone === initialData.phone),

    customerGroupId: initialData?.customerGroupId ?? "",

    email: initialData?.email ?? "",

    address: initialData?.address ?? "",

    area: initialData?.area ?? "",

    shift: initialData?.shift ?? "Morning",

    paymentReminder: initialData?.paymentReminder ?? "Monthly",

    jarRate: String(initialData?.jarRate ?? "20"),

    openingBalance: String(initialData?.openingBalance ?? "0"),

    notes: initialData?.notes ?? "",

  }));



  const [groups, setGroups] = useState([]);

  const [groupsLoading, setGroupsLoading] = useState(true);

  const [groupsError, setGroupsError] = useState("");

  const [error, setError] = useState("");



  useEffect(() => {

    let active = true;



    async function loadGroups() {

      setGroupsLoading(true);

      setGroupsError("");



      try {

        const { data: authData, error: authError } =

          await supabase.auth.getUser();



        if (authError) throw authError;

        if (!authData?.user) {

          throw new Error("Please log in to load customer groups.");

        }



        const { data: business, error: businessError } = await supabase

          .from("businesses")

          .select("id")

          .eq("owner_id", authData.user.id)

          .maybeSingle();



        if (businessError) throw businessError;

        if (!business?.id) {

          throw new Error("Business profile not found.");

        }



        const { data, error: groupError } = await supabase

          .from("customer_groups")

          .select("id, name")

          .eq("business_id", business.id)

          .order("name");



        if (groupError) throw groupError;



        if (active) {

          setGroups(data || []);

        }

      } catch (err) {

        if (active) {

          setGroupsError(

            err?.message || "Unable to load customer groups."

          );

        }

      } finally {

        if (active) setGroupsLoading(false);

      }

    }



    loadGroups();



    return () => {

      active = false;

    };

  }, []);



  function handleChange(event) {

    const { name, value } = event.target;



    setForm((previous) => {

      const next = { ...previous, [name]: value };



      if (name === "phone" && previous.sameBillingPhone) {

        next.billingPhone = value;

      }



      return next;

    });



    if (error) setError("");

  }



  function handlePhoneChange(event) {

    const value = event.target.value.replace(/\D/g, "").slice(0, 10);



    setForm((previous) => ({

      ...previous,

      phone: value,

      billingPhone: previous.sameBillingPhone

        ? value

        : previous.billingPhone,

    }));



    if (error) setError("");

  }



  function handleBillingToggle(checked) {

    setForm((previous) => ({

      ...previous,

      sameBillingPhone: checked,

      billingPhone: checked ? previous.phone : previous.billingPhone,

    }));

  }



  function handleBillingPhoneChange(event) {

    const value = event.target.value.replace(/\D/g, "").slice(0, 10);



    setForm((previous) => ({

      ...previous,

      billingPhone: value,

    }));

  }



  async function handleSubmit(event) {

    event.preventDefault();

    setError("");



    const name = form.name.trim();

    const phone = form.phone.replace(/\D/g, "");

    const billingPhone = form.sameBillingPhone

      ? phone

      : form.billingPhone.replace(/\D/g, "");

    const email = form.email.trim();

    const jarRate = Number(form.jarRate);

    const openingBalance = Number(form.openingBalance);



    if (!name) {

      setError("Please enter the full customer name.");

      return;

    }



    if (phone.length !== 10) {

      setError("Mobile number must contain exactly 10 digits.");

      return;

    }



    if (billingPhone.length !== 10) {

      setError("Billing mobile number must contain exactly 10 digits.");

      return;

    }



    if (!form.customerGroupId) {

      setError("Please select a customer group.");

      return;

    }



    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {

      setError("Please enter a valid email address.");

      return;

    }



    if (!form.shift || !form.paymentReminder) {

      setError("Please select delivery shift and payment reminder.");

      return;

    }



    if (

      form.jarRate.trim() === "" ||

      !Number.isFinite(jarRate) ||

      jarRate < 0

    ) {

      setError("Enter a valid non-negative jar price.");

      return;

    }



    if (

      form.openingBalance.trim() === "" ||

      !Number.isFinite(openingBalance)

    ) {

      setError("Enter a valid opening balance.");

      return;

    }



    if (typeof onSubmit !== "function") {

      setError("Form submission is not configured.");

      return;

    }



    try {

      await onSubmit({

        ...form,

        name,

        phone,

        billingPhone,

        email,

        customerGroupId: form.customerGroupId,

        address: form.address.trim(),

        area: form.area.trim(),

        jarRate,

        openingBalance,

        notes: form.notes.trim(),

      });

    } catch (err) {

      setError(err?.message || "Unable to save customer details.");

    }

  }



  return (

    <form onSubmit={handleSubmit} className="space-y-4 bg-white px-4 py-3 sm:space-y-5 sm:bg-transparent sm:p-0">

      {error && (

        <div

          role="alert"

          className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"

        >

          <AlertCircle size={19} className="mt-0.5 shrink-0" />

          <p className="leading-6">{error}</p>

        </div>

      )}



      <section className="overflow-hidden rounded-none border-0 bg-white shadow-none sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-sm">

        <SectionHeading

          icon={UserRound}

          title="Customer Information"

          description="Basic details and contact information"

        />



        <div className="grid grid-cols-1 gap-4 px-1 py-2 sm:grid-cols-2 sm:gap-5 sm:p-6">

          <Field

            label="Full Name"

            name="name"

            value={form.name}

            onChange={handleChange}

            placeholder="Enter full name"

            icon={UserRound}

            autoComplete="name"

            required

          />



          <Field

            label="Mobile No"

            name="phone"

            value={form.phone}

            onChange={handlePhoneChange}

            placeholder="10-digit mobile number"

            icon={Phone}

            type="tel"

            autoComplete="tel"

            maxLength={10}

            required

          />



          <div className="sm:col-span-2">

            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">

              <label className={labelClass}>

                Billing Mobile No

                <span className="ml-1 text-rose-500">*</span>

              </label>



              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-teal-800">

                <input

                  type="checkbox"

                  checked={form.sameBillingPhone}

                  onChange={(event) =>

                    handleBillingToggle(event.target.checked)

                  }

                  className="size-4 accent-teal-700"

                />

                <Copy size={14} />

                Same as Mobile No

              </label>

            </div>



            <Field

              label=""

              name="billingPhone"

              value={

                form.sameBillingPhone ? form.phone : form.billingPhone

              }

              onChange={handleBillingPhoneChange}

              placeholder="10-digit billing mobile number"

              icon={Phone}

              type="tel"

              maxLength={10}

              disabled={form.sameBillingPhone}

              required

              help={

                form.sameBillingPhone

                  ? "Billing number automatically follows the primary mobile number."

                  : "Enter a separate number for billing messages."

              }

            />

          </div>



          <SelectField

            label="Customer Group"

            name="customerGroupId"

            value={form.customerGroupId}

            onChange={handleChange}

            icon={Users}

            required

            placeholder={

              groupsLoading ? "Loading groups..." : "Select customer group"

            }

            disabled={groupsLoading || Boolean(groupsError)}

            options={groups.map((group) => ({

              value: group.id,

              label: group.name,

            }))}

          />



          <Field

            label="Email"

            name="email"

            value={form.email}

            onChange={handleChange}

            placeholder="customer@example.com"

            icon={Mail}

            type="email"

            autoComplete="email"

          />



          <Field

            label="Area / Mohalla"

            name="area"

            value={form.area}

            onChange={handleChange}

            placeholder="e.g. Main Market"

            icon={Navigation}

            autoComplete="address-level2"

          />



          <Field

            label="Full Address"

            name="address"

            value={form.address}

            onChange={handleChange}

            placeholder="House number, street, landmark"

            icon={MapPin}

            autoComplete="street-address"

          />



          <div className="min-w-0">
            <div className="mb-2 text-xs font-medium text-teal-700">Select Shift</div>
            <div className="grid grid-cols-3 gap-2 sm:hidden">
              {["Morning", "Afternoon", "Evening"].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((previous) => ({ ...previous, shift: value }))}
                  className={`rounded-full border px-2 py-2.5 text-xs font-semibold shadow-sm ${form.shift === value
                      ? "border-teal-600 bg-teal-600 text-white"
                      : "border-teal-100 bg-white text-teal-700"
                    }`}
                >
                  {value}
                </button>
              ))}
            </div>
            <div className="hidden sm:block">
              <SelectField
                label="Select Shift"
                name="shift"
                value={form.shift}
                onChange={handleChange}
                icon={Clock}
                required
                options={[
                  { value: "Morning", label: "Morning" },
                  { value: "Afternoon", label: "Afternoon" },
                  { value: "Evening", label: "Evening" },
                  { value: "Night", label: "Night" },
                ]}
              />
            </div>
          </div>



          <div className="min-w-0">
            <div className="mb-2 text-xs font-medium text-teal-700">Payment Reminder</div>
            <div className="grid grid-cols-3 gap-2 sm:hidden">
              {["Daily", "Weekly", "Monthly"].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((previous) => ({ ...previous, paymentReminder: value }))}
                  className={`rounded-full border px-2 py-2.5 text-xs font-semibold shadow-sm ${form.paymentReminder === value
                      ? "border-teal-600 bg-teal-600 text-white"
                      : "border-teal-100 bg-white text-teal-700"
                    }`}
                >
                  {value}
                </button>
              ))}
            </div>
            <div className="hidden sm:block">
              <SelectField
                label="Payment Reminder"
                name="paymentReminder"
                value={form.paymentReminder}
                onChange={handleChange}
                icon={Bell}
                required
                options={[
                  { value: "Daily", label: "Daily" },
                  { value: "Weekly", label: "Weekly" },
                  { value: "Monthly", label: "Monthly" },
                ]}
              />
            </div>
          </div>



          {groupsError && (

            <div className="sm:col-span-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">

              {groupsError}

            </div>

          )}



          {!groupsLoading && !groupsError && groups.length === 0 && (

            <div className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">

              No customer groups found. Create a group before adding a customer.

            </div>

          )}

        </div>

      </section>



      <section className="overflow-hidden rounded-none border-0 bg-white shadow-none sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-sm">

        <SectionHeading

          icon={Wallet}

          title="Pricing & Account"

          description="Set the default jar price and starting balance"

        />



        <div className="grid grid-cols-1 gap-4 px-1 py-2 sm:grid-cols-2 sm:gap-5 sm:p-6">

          <Field

            label="Price Per Jar (₹)"

            name="jarRate"

            value={form.jarRate}

            onChange={handleChange}

            placeholder="20"

            icon={Droplets}

            type="number"

            min="0"

            step="0.01"

            required

            help="Default price used when recording deliveries."

          />



          <Field

            label="Opening Balance (₹)"

            name="openingBalance"

            value={form.openingBalance}

            onChange={handleChange}

            placeholder="0.00"

            icon={IndianRupee}

            type="number"

            step="0.01"

            required

            help="Enter the customer's starting account balance."

          />

        </div>



        <div className="mx-5 mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:mx-6 sm:mb-6">

          <ShieldCheck size={19} className="mt-0.5 shrink-0 text-amber-700" />

          <div>

            <p className="text-sm font-semibold text-amber-900">

              Verify account balance

            </p>

            <p className="mt-1 text-xs leading-5 text-amber-800">

              Confirm the opening balance before saving and make sure it

              matches your accounting records.

            </p>

          </div>

        </div>

      </section>



      <section className="overflow-hidden rounded-none border-0 bg-white shadow-none sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-sm">

        <SectionHeading

          icon={FileText}

          title="Additional Notes"

          description="Optional instructions or customer preferences"

        />



        <div className="p-5 sm:p-6">

          <label htmlFor="notes" className={labelClass}>

            Notes

          </label>



          <textarea

            id="notes"

            name="notes"

            rows={4}

            value={form.notes}

            onChange={handleChange}

            placeholder="Delivery instructions, preferred timing, or other details..."

            className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"

          />

        </div>

      </section>



      <div className="sticky bottom-0 z-10 -mx-4 border-t border-slate-100 bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:rounded-2xl sm:border sm:px-5 sm:py-4">

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">

          <p className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">

            <CheckCircle2 size={15} className="text-teal-600" />

            Fields marked * are required.

          </p>



          <div className="flex flex-col-reverse gap-3 sm:flex-row">

            {onCancel && (

              <button

                type="button"

                onClick={onCancel}

                disabled={submitting}

                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"

              >

                <ArrowLeft size={16} />

                Cancel

              </button>

            )}



            <button

              type="submit"

              disabled={

                submitting ||

                groupsLoading ||

                Boolean(groupsError) ||

                groups.length === 0

              }

              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#079fc3] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:rounded-xl sm:bg-teal-700"

            >

              {submitting ? (

                <LoaderCircle size={17} className="animate-spin" />

              ) : (

                <Save size={17} />

              )}



              {submitting ? "Saving..." : "Save Customer"}

            </button>

          </div>

        </div>

      </div>
    </form>

  );

}
