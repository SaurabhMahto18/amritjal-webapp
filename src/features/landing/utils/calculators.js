
const round = (value) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

export function calculateHomeWaterExpense(values) {
  const people = Number(values.people);
  const dailyUsage = Number(values.dailyUsage);
  const jarSize = Number(values.jarSize);
  const pricePerJar = Number(values.pricePerJar);

  if (
    !Number.isFinite(people) ||
    !Number.isFinite(dailyUsage) ||
    !Number.isFinite(jarSize) ||
    !Number.isFinite(pricePerJar) ||
    people <= 0 ||
    dailyUsage <= 0 ||
    jarSize <= 0 ||
    pricePerJar < 0
  ) {
    throw new Error("Please enter valid household water details.");
  }

  const dailyConsumption = people * dailyUsage;
  const monthlyConsumption = dailyConsumption * 30;

  // Round up the total monthly jar requirement.
  const monthlyJars = Math.ceil(monthlyConsumption / jarSize);

  const monthlyExpense = monthlyJars * pricePerJar;
  const yearlyExpense = monthlyExpense * 12;

  const perLitreCost =
    monthlyConsumption > 0
      ? monthlyExpense / monthlyConsumption
      : 0;

  return {
    title: "Estimated monthly expense",
    primaryValue: formatCurrency(monthlyExpense),
    details: [
      {
        label: "Jars / month",
        value: monthlyJars.toLocaleString("en-IN"),
      },
      {
        label: "Per year",
        value: formatCurrency(yearlyExpense),
      },
      {
        label: "Per litre",
        value: formatCurrency(perLitreCost),
      },
    ],
    note: "Based on a 30-day month. Monthly jars are rounded up to whole jars.",
  };
}

export function calculateTDS(values) {
  const tds = Number(values.tds);

  if (!Number.isFinite(tds) || tds < 0) {
    throw new Error("Please enter a valid non-negative TDS reading.");
  }

  let status;
  let description;

  if (tds <= 300) {
    status = "Lower TDS reading";
    description =
      "The measured dissolved-solids level is relatively low.";
  } else if (tds <= 500) {
    status = "Moderate TDS reading";
    description =
      "The reading is within the commonly referenced desirable range.";
  } else if (tds <= 2000) {
    status = "Higher TDS reading";
    description =
      "The reading is above the commonly referenced desirable range.";
  } else {
    status = "Very high TDS reading";
    description =
      "The measured dissolved-solids level is very high.";
  }

  return {
    title: "Your water TDS result",
    primaryValue: `${round(tds)} PPM`,
    status,
    description,
    details: [
      {
        label: "Measured TDS",
        value: `${round(tds)} mg/L`,
      },
      {
        label: "Common desirable reference",
        value: "Up to 500 mg/L",
      },
    ],
    note: "TDS alone cannot determine whether water is safe to drink. It does not identify individual contaminants or replace laboratory water-quality testing.",
  };
}

export function calculateJarDeliveryProfit(values) {
  const jarsPerDay = Number(values.jarsPerDay);
  const sellingPrice = Number(values.sellingPrice);
  const costPerJar = Number(values.costPerJar);
  const deliveryCost = Number(values.deliveryCost);
  const workingDays = Number(values.workingDays);

  const inputs = [
    jarsPerDay,
    sellingPrice,
    costPerJar,
    deliveryCost,
    workingDays,
  ];

  if (
    inputs.some((value) => !Number.isFinite(value) || value < 0) ||
    jarsPerDay <= 0 ||
    workingDays <= 0 ||
    workingDays > 31
  ) {
    throw new Error("Please enter valid business figures.");
  }

  const dailyRevenue = jarsPerDay * sellingPrice;
  const dailyProductCost = jarsPerDay * costPerJar;
  const dailyProfit =
    dailyRevenue - dailyProductCost - deliveryCost;

  const monthlyRevenue = dailyRevenue * workingDays;
  const monthlyProductCost = dailyProductCost * workingDays;
  const monthlyDeliveryCost = deliveryCost * workingDays;
  const monthlyProfit = dailyProfit * workingDays;

  const margin =
    monthlyRevenue > 0
      ? (monthlyProfit / monthlyRevenue) * 100
      : 0;

  return {
    title: "Estimated monthly business profit",
    primaryValue: formatCurrency(monthlyProfit),
    status: monthlyProfit >= 0 ? "Estimated profit" : "Estimated loss",
    details: [
      {
        label: "Monthly revenue",
        value: formatCurrency(monthlyRevenue),
      },
      {
        label: "Jar/product cost",
        value: formatCurrency(monthlyProductCost),
      },
      {
        label: "Delivery and operating cost",
        value: formatCurrency(monthlyDeliveryCost),
      },
      {
        label: "Monthly profit / loss",
        value: formatCurrency(monthlyProfit),
      },
      {
        label: "Estimated profit margin",
        value: `${round(margin)}%`,
      },
    ],
    note: "Estimate excludes costs not entered, such as salaries, rent, maintenance, taxes, jar depreciation and other overheads.",
  };
}

export function calculateWaterPH(values) {
  const ph = Number(values.ph);

  if (!Number.isFinite(ph) || ph < 0 || ph > 14) {
    throw new Error("Please enter a pH value between 0 and 14.");
  }

  let status;
  let description;

  if (ph < 7) {
    status = "Acidic";
    description = "Your entered reading is below neutral pH.";
  } else if (ph > 7) {
    status = "Alkaline";
    description = "Your entered reading is above neutral pH.";
  } else {
    status = "Neutral";
    description = "Your entered reading is at neutral pH.";
  }

  const withinReferenceRange = ph >= 6.5 && ph <= 8.5;

  return {
    title: "Your water pH result",
    primaryValue: `${round(ph)} pH`,
    status,
    description,
    details: [
      {
        label: "Measured pH",
        value: `${round(ph)}`,
      },
      {
        label: "Common drinking-water reference range",
        value: "6.5 – 8.5",
      },
      {
        label: "Reference range check",
        value: withinReferenceRange
          ? "Within reference range"
          : "Outside reference range",
      },
    ],
    note: "This pH reading is not a complete water-safety assessment. Use a calibrated meter or suitable test kit. Laboratory testing is needed when water quality is in doubt.",
  };
}

export const calculatorFunctions = {
  "home-water-expense": calculateHomeWaterExpense,
  "tds-calculator": calculateTDS,
  "jar-delivery-profit": calculateJarDeliveryProfit,
  "water-ph-calculator": calculateWaterPH,
};
