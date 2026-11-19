
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  CalendarDays,
  Clock3,
  Package,
  Plus,
  Minus,
  X,
  RotateCcw,
  Check,
  LoaderCircle,
  UserRound,
  AlertCircle,
} from "lucide-react";

import deliveryService from "../../deliveries/services/deliveryService";

const today = () => {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

function normalizeEmployee(employee) {
  return {
    id: employee.id,
    name:
      employee.name ||
      employee.full_name ||
      employee.employee_name ||
      employee.fullName ||
      "",
    phone: employee.phone || "",
    role: employee.role || employee.job_title || "",
    status: employee.status || "active",
  };
}

function createRow(product, eventRate = null) {
  const defaultRate =
    product.isReturnableJar && Number(eventRate) > 0
      ? Number(eventRate)
      : Number(product.unitPrice ?? product.salePrice ?? 0);

  return {
    productId: product.productId,
    productName: product.productName,
    unit: product.unit || "unit",
    isReturnableJar: Boolean(product.isReturnableJar),
    quantity: 1,
    returned: 0,
    unitPrice: defaultRate,
  };
}

function getShiftFromTime(time) {
  if (!time) return "evening";

  const hour = Number(time.split(":")[0]);

  if (hour < 12) return "morning";
  if (hour < 16) return "afternoon";
  if (hour < 21) return "evening";

  return "night";
}

export default function EventBookingForm({
  event,
  customers = [],
  employees = [],
  initialData = null,
  onSubmit,
  onCancel,
}) {
  const customerId =
    event?.customerId || event?.customer_id || "";

  const eventDate =
    event?.startOn || event?.start_on || today();

  const eventRate =
    event?.ratePerJar ??
    event?.rate_per_jar ??
    null;

  const [employeeId, setEmployeeId] = useState(
    initialData?.deliveredBy ||
      initialData?.delivered_by ||
      ""
  );

  const [date, setDate] = useState(
    initialData?.date ||
      initialData?.delivery_date ||
      eventDate
  );

  const [time, setTime] = useState(
    initialData?.bookingTime ||
      initialData?.booking_time ||
      ""
  );

  const [employeeOptions, setEmployeeOptions] = useState(() =>
    (employees || [])
      .map(normalizeEmployee)
      .filter((employee) => employee.id && employee.status !== "inactive")
  );

  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const [assignedProducts, setAssignedProducts] = useState([]);
  const [rows, setRows] = useState([]);

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const customer = customers.find(
    (item) => String(item.id) === String(customerId)
  );

  const employee = employeeOptions.find(
    (item) => String(item.id) === String(employeeId)
  );

  const totalQuantity = useMemo(
    () =>
      rows.reduce(
        (sum, row) => sum + Number(row.quantity || 0),
        0
      ),
    [rows]
  );

  const totalAmount = useMemo(
    () =>
      rows.reduce(
        (sum, row) =>
          sum +
          Number(row.quantity || 0) *
            Number(row.unitPrice || 0),
        0
      ),
    [rows]
  );

  const selectedIds = useMemo(
    () => new Set(rows.map((row) => row.productId)),
    [rows]
  );

  const availableProducts = useMemo(
    () =>
      assignedProducts.filter(
        (product) => !selectedIds.has(product.productId)
      ),
    [assignedProducts, selectedIds]
  );

  /* ---------------------------------------------
     EMPLOYEE LOADING

     Prefer employees passed by parent.
     If parent list is empty, fetch directly.
  --------------------------------------------- */

  useEffect(() => {
    let active = true;

    const suppliedEmployees = (employees || [])
      .map(normalizeEmployee)
      .filter(
        (employee) =>
          employee.id && employee.status !== "inactive"
      );

    if (suppliedEmployees.length > 0) {
      setEmployeeOptions(suppliedEmployees);
      setLoadingEmployees(false);
      return () => {
        active = false;
      };
    }

    async function loadEmployees() {
      setLoadingEmployees(true);

      try {
        const data = await deliveryService.getEmployees();

        if (!active) return;

        const normalized = (data || [])
          .map(normalizeEmployee)
          .filter(
            (employee) =>
              employee.id && employee.status !== "inactive"
          );

        setEmployeeOptions(normalized);

        if (!normalized.length) {
          setError(
            "No active employees found. Please check the Employees section."
          );
        } else {
          setError("");
        }
      } catch (err) {
        if (active) {
          setEmployeeOptions([]);
          setError(
            err?.message || "Unable to load employees."
          );
        }
      } finally {
        if (active) setLoadingEmployees(false);
      }
    }

    void loadEmployees();

    return () => {
      active = false;
    };
  }, [employees]);

  /* ---------------------------------------------
     LOAD CUSTOMER ASSIGNED PRODUCTS
  --------------------------------------------- */

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      if (!customerId || !date) {
        setAssignedProducts([]);
        setRows([]);
        return;
      }

      setLoadingProducts(true);
      setError("");

      try {
        const [plans, products] = await Promise.all([
          deliveryService.getCustomerRatePlans(customerId, date),
          deliveryService.getProducts(),
        ]);

        if (!active) return;

        const productMap = new Map(
          (products || []).map((product) => [
            product.id,
            product,
          ])
        );

        const mapped = (plans || [])
          .map((plan) => {
            const product = productMap.get(plan.product_id);

            if (!product) return null;

            return {
              planId: plan.id,
              productId: product.id,
              productName: product.name,
              sku: product.sku || "",
              unit: product.unit || "unit",
              unitPrice: Number(plan.unit_price || 0),
              salePrice: Number(product.sale_price || 0),
              defaultQuantity: Number(
                plan.default_quantity || 1
              ),
              isReturnableJar: Boolean(
                product.is_returnable_jar
              ),
            };
          })
          .filter(Boolean);

        setAssignedProducts(mapped);

        setRows((previous) => {
          if (!previous.length) return [];

          return previous
            .map((row) => {
              const updated = mapped.find(
                (product) =>
                  product.productId === row.productId
              );

              if (!updated) return null;

              return {
                ...row,
                productName: updated.productName,
                unit: updated.unit,
                isReturnableJar: updated.isReturnableJar,
              };
            })
            .filter(Boolean);
        });
      } catch (err) {
        if (active) {
          setError(
            err?.message || "Unable to load assigned products."
          );
        }
      } finally {
        if (active) setLoadingProducts(false);
      }
    }

    void loadProducts();

    return () => {
      active = false;
    };
  }, [customerId, date]);

  /* ---------------------------------------------
     PRODUCT ACTIONS
  --------------------------------------------- */

  function addProduct(product) {
    if (!product) return;

    setRows((previous) => [
      ...previous,
      createRow(product, eventRate),
    ]);
  }

  function updateRow(productId, field, value) {
    setRows((previous) =>
      previous.map((row) => {
        if (row.productId !== productId) return row;

        if (field === "quantity") {
          const quantity = Math.max(1, Number(value) || 1);

          return {
            ...row,
            quantity,
            returned: Math.min(
              Number(row.returned || 0),
              quantity
            ),
          };
        }

        if (field === "returned") {
          return {
            ...row,
            returned: Math.min(
              Number(row.quantity),
              Math.max(0, Number(value) || 0)
            ),
          };
        }

        return {
          ...row,
          [field]: value,
        };
      })
    );
  }

  function changeNumber(productId, field, amount) {
    setRows((previous) =>
      previous.map((row) => {
        if (row.productId !== productId) return row;

        const current = Number(row[field] || 0);
        const next = Math.max(0, current + amount);

        if (field === "quantity") {
          const quantity = Math.max(1, next);

          return {
            ...row,
            quantity,
            returned: Math.min(
              Number(row.returned || 0),
              quantity
            ),
          };
        }

        if (field === "returned") {
          return {
            ...row,
            returned: Math.min(Number(row.quantity), next),
          };
        }

        return row;
      })
    );
  }

  function removeProduct(productId) {
    setRows((previous) =>
      previous.filter((row) => row.productId !== productId)
    );
  }

  function resetForm() {
    setEmployeeId("");
    setDate(eventDate);
    setTime("");
    setRows([]);
    setError("");
  }

  /* ---------------------------------------------
     SUBMIT
  --------------------------------------------- */

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!customerId) {
      setError(
        "This event does not have a registered customer."
      );
      return;
    }

    if (!employeeId) {
      setError("Please select an employee.");
      return;
    }

    if (!date) {
      setError("Please select a booking date.");
      return;
    }

    if (!time) {
      setError("Please select a booking time.");
      return;
    }

    if (!rows.length) {
      setError("Please add at least one product.");
      return;
    }

    for (const row of rows) {
      if (
        !Number.isFinite(Number(row.quantity)) ||
        Number(row.quantity) <= 0
      ) {
        setError(
          `Enter a valid quantity for ${row.productName}.`
        );
        return;
      }

      if (
        !Number.isFinite(Number(row.unitPrice)) ||
        Number(row.unitPrice) < 0
      ) {
        setError(
          `Enter a valid price for ${row.productName}.`
        );
        return;
      }

      if (
        Number(row.returned) < 0 ||
        Number(row.returned) > Number(row.quantity)
      ) {
        setError(
          `Returned quantity for ${row.productName} is invalid.`
        );
        return;
      }
    }

    setSaving(true);

    try {
      await onSubmit({
        customerId,
        eventId: event.id,
        date,
        time,
        bookingTime: time,
        shift: getShiftFromTime(time),
        deliveredBy: employeeId,
        deliveryPerson: employee?.name || "",
        notes: "",
        items: rows.map((row) => ({
          productId: row.productId,
          quantity: Number(row.quantity),
          returned: row.isReturnableJar
            ? Number(row.returned)
            : 0,
          unitPrice: Number(row.unitPrice),
        })),
      });
    } catch (err) {
      setError(
        err?.message || "Unable to save booking."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ---------------------------------------------
     UI
  --------------------------------------------- */

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-full flex-col bg-white"
    >
      <div className="min-h-0 flex-1 space-y-5 pb-5">

        {/* Employee and Schedule */}

        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_5px_18px_rgba(15,23,42,0.12)]">
          <label
            htmlFor="event-booking-employee"
            className="mb-2 flex items-center justify-between text-sm font-semibold text-[#269BB7]"
          >
            Employee Name
            <span className="text-red-500">*</span>
          </label>

          <div className="relative">
            <UserRound
              size={18}
              className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <select
              id="event-booking-employee"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
              disabled={loadingEmployees}
              className="h-12 w-full appearance-none border-b-2 border-[#269BB7] bg-white pl-8 pr-8 text-sm text-slate-700 outline-none disabled:opacity-60"
            >
              <option value="">
                {loadingEmployees
                  ? "Loading employees..."
                  : employeeOptions.length
                    ? "Select Employee"
                    : "No employees found"}
              </option>

              {employeeOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name || "Unnamed Employee"}
                  {item.role ? ` — ${item.role}` : ""}
                </option>
              ))}
            </select>

            {loadingEmployees ? (
              <LoaderCircle
                size={17}
                className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
              />
            ) : (
              <ArrowDown
                size={17}
                className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-slate-400"
              />
            )}
          </div>

          {!loadingEmployees && employeeOptions.length === 0 && (
            <p className="mt-2 text-xs text-rose-500">
              No active employees found. Check the Employees section
              and business assignment.
            </p>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <label
                htmlFor="event-booking-date"
                className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#269BB7]"
              >
                Select Date *
                <CalendarDays size={19} />
              </label>

              <input
                id="event-booking-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-12 w-full min-w-0 border-b-2 border-[#269BB7] bg-white px-1 text-sm text-slate-700 outline-none"
              />
            </div>

            <div className="min-w-0">
              <label
                htmlFor="event-booking-time"
                className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#269BB7]"
              >
                Select Time *
                <Clock3 size={19} />
              </label>

              <input
                id="event-booking-time"
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-12 w-full min-w-0 border-b-2 border-[#269BB7] bg-white px-1 text-sm text-slate-700 outline-none"
              />
            </div>
          </div>
        </section>

        {/* Selected Products */}

        <section>
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Selected Products
            </h3>

            <button
              type="button"
              disabled={
                !availableProducts.length || loadingProducts
              }
              onClick={() => addProduct(availableProducts[0])}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-[#269BB7] disabled:opacity-40"
            >
              <Plus size={20} />
              Add Products
            </button>
          </div>

          {loadingProducts && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 p-5 text-sm text-slate-500">
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
              Loading assigned products...
            </div>
          )}

          {!loadingProducts &&
            customerId &&
            assignedProducts.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                No products assigned to this customer for the selected date.
              </div>
            )}

          {!loadingProducts &&
            assignedProducts.length > 0 &&
            !rows.length && (
              <button
                type="button"
                onClick={() => addProduct(availableProducts[0])}
                disabled={!availableProducts.length}
                className="flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#269BB7] bg-cyan-50/40 text-sm font-semibold text-[#168DA9] disabled:opacity-40"
              >
                <Plus size={20} />
                Add your first product
              </button>
            )}

          <div className="space-y-4">
            {rows.map((row) => (
              <article
                key={row.productId}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_5px_16px_rgba(15,23,42,0.13)]"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-[#079FCB]">
                    <Package size={27} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-base font-semibold text-slate-800">
                      {row.productName}
                    </h4>

                    <p className="text-xs text-slate-400">
                      {row.unit}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeProduct(row.productId)}
                    aria-label={`Remove ${row.productName}`}
                    className="flex size-9 items-center justify-center rounded-full text-slate-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <X size={21} />
                  </button>
                </div>

                {/* Price Per Unit */}

                <div className="mb-3 flex items-center justify-between gap-2">
                  <label className="text-sm text-slate-700">
                    Price Per Unit
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateRow(
                          row.productId,
                          "unitPrice",
                          Math.max(
                            0,
                            Number(row.unitPrice) - 1
                          )
                        )
                      }
                      className="flex size-10 items-center justify-center rounded-lg bg-[#079FCB] text-white"
                    >
                      <Minus size={20} />
                    </button>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.unitPrice}
                      onChange={(e) =>
                        updateRow(
                          row.productId,
                          "unitPrice",
                          e.target.value
                        )
                      }
                      aria-label={`${row.productName} price per unit`}
                      className="h-10 w-[100px] rounded-lg border-2 border-slate-300 text-center text-base font-semibold text-slate-800 outline-none focus:border-[#079FCB]"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        updateRow(
                          row.productId,
                          "unitPrice",
                          Number(row.unitPrice) + 1
                        )
                      }
                      className="flex size-10 items-center justify-center rounded-lg bg-[#079FCB] text-white"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                {/* Quantity */}

                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm text-slate-700">
                    Qty
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        changeNumber(
                          row.productId,
                          "quantity",
                          -1
                        )
                      }
                      className="flex size-10 items-center justify-center rounded-lg bg-[#079FCB] text-white"
                    >
                      <Minus size={20} />
                    </button>

                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={row.quantity}
                      onChange={(e) =>
                        updateRow(
                          row.productId,
                          "quantity",
                          e.target.value
                        )
                      }
                      aria-label={`${row.productName} quantity`}
                      className="h-10 w-[100px] rounded-lg border-2 border-slate-300 text-center text-base font-semibold text-slate-800 outline-none focus:border-[#079FCB]"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        changeNumber(
                          row.productId,
                          "quantity",
                          1
                        )
                      }
                      className="flex size-10 items-center justify-center rounded-lg bg-[#079FCB] text-white"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                {/* Jar Returns */}

                {row.isReturnableJar && (
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <label className="text-sm text-slate-700">
                      Jars Returned
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          changeNumber(
                            row.productId,
                            "returned",
                            -1
                          )
                        }
                        className="flex size-9 items-center justify-center rounded-lg bg-slate-200 text-slate-700"
                      >
                        <Minus size={17} />
                      </button>

                      <input
                        type="number"
                        min="0"
                        max={row.quantity}
                        step="1"
                        value={row.returned}
                        onChange={(e) =>
                          updateRow(
                            row.productId,
                            "returned",
                            e.target.value
                          )
                        }
                        className="h-9 w-20 rounded-lg border border-slate-300 text-center text-sm"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          changeNumber(
                            row.productId,
                            "returned",
                            1
                          )
                        }
                        className="flex size-9 items-center justify-center rounded-lg bg-slate-200 text-slate-700"
                      >
                        <Plus size={17} />
                      </button>
                    </div>
                  </div>
                )}

                <p className="mt-3 text-right text-xs text-slate-500">
                  Price To Customer ({money(row.unitPrice)} ×{" "}
                  {Number(row.quantity || 0)}) ={" "}
                  <strong className="text-slate-800">
                    {money(
                      Number(row.unitPrice || 0) *
                        Number(row.quantity || 0)
                    )}
                  </strong>
                </p>
              </article>
            ))}
          </div>

          {rows.length > 0 &&
            availableProducts.length > 0 && (
              <button
                type="button"
                onClick={() => addProduct(availableProducts[0])}
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#269BB7] text-sm font-semibold text-[#168DA9]"
              >
                <Plus size={18} />
                Add Another Product
              </button>
            )}
        </section>

        {/* Error */}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <div className="flex items-start gap-2">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Total */}

        {rows.length > 0 && (
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Total Products</span>
              <strong>{rows.length}</strong>
            </div>

            <div className="mt-2 flex justify-between text-sm text-slate-600">
              <span>Total Quantity</span>
              <strong>{totalQuantity}</strong>
            </div>

            <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
              <span>Total Amount</span>
              <span>{money(totalAmount)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Actions */}

      <footer className="sticky bottom-0 z-10 -mx-3 flex shrink-0 gap-3 border-t border-slate-100 bg-white px-3 py-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:static sm:mx-0 sm:border-0 sm:px-0 sm:pb-0">
        <button
          type="button"
          onClick={resetForm}
          disabled={saving}
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg border-2 border-[#079FCB] bg-white text-sm font-bold text-[#079FCB] disabled:opacity-50"
        >
          <RotateCcw size={17} />
          Reset
        </button>

        <button
          type="submit"
          disabled={
            saving ||
            loadingProducts ||
            loadingEmployees ||
            !employeeOptions.length
          }
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-[#079FCB] text-sm font-bold text-white shadow-md disabled:opacity-50"
        >
          {saving ? (
            <>
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
              Saving...
            </>
          ) : (
            <>
              <Check size={18} />
              Submit
            </>
          )}
        </button>
      </footer>
    </form>
  );
}
