import React from "react";

type ExpiryBadgeProps = {
  order: any;
  isArchivedPage?: boolean;
  hideExpiredDates?: boolean;
};

type ExpiryEntry = {
  type: string;
  label: string;
  date: string;
  key: string;
};

export default function ExpiryBadge({
  order,
  isArchivedPage = false,
}: ExpiryBadgeProps) {
  // -----------------------------------------
  // Get status from string or status object
  // -----------------------------------------
  const getStatusValue = (status: any): string => {
    if (typeof status === "string") {
      return status.trim().toUpperCase();
    }

    if (status && typeof status === "object") {
      return String(
        status.code ?? status.name ?? ""
      )
        .trim()
        .toUpperCase();
    }

    return "";
  };

  // -----------------------------------------
  // Check CANCELLED / TRANSFERRED status
  // -----------------------------------------
  const isCancelledOrTransferred = (
    status: any
  ): boolean => {
    const value = getStatusValue(status);

    return [
      "CANCELLED",
      "CANCELED",
      "TRANSFERRED",
    ].includes(value);
  };

  // -----------------------------------------
  // Format date as DD/MM/YYYY
  // -----------------------------------------
  const formatDate = (
    date?: string | Date | null
  ): string | null => {
    if (!date) return null;

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      return null;
    }

    const day = String(d.getUTCDate()).padStart(
      2,
      "0"
    );

    const month = String(
      d.getUTCMonth() + 1
    ).padStart(2, "0");

    const year = d.getUTCFullYear();

    return `${day}/${month}/${year}`;
  };

  // -----------------------------------------
  // Get date key
  // -----------------------------------------
  const getDateKey = (
    date?: string | Date | null
  ): string | null => {
    if (!date) return null;

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      return null;
    }

    const year = d.getUTCFullYear();

    const month = String(
      d.getUTCMonth() + 1
    ).padStart(2, "0");

    const day = String(
      d.getUTCDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // -----------------------------------------
  // Expiry badge colours
  // -----------------------------------------
  const getExpiryColor = (dateKey: string) => {
    const [year, month, day] = dateKey
      .split("-")
      .map(Number);

    const expiryDate = Date.UTC(
      year,
      month - 1,
      day
    );

    const now = new Date();

    const todayUTC = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    );

    const diffDays = Math.ceil(
      (expiryDate - todayUTC) /
        (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) {
      return {
        bg: "bg-red-100",
        text: "text-red-800",
      };
    }

    if (diffDays <= 15) {
      return {
        bg: "bg-orange-100",
        text: "text-orange-800",
      };
    }

    return {
      bg: "bg-green-100",
      text: "text-green-800",
    };
  };

  // -----------------------------------------
  // Cancelled/transferred hiding applies only
  // to the normal Orders page.
  // -----------------------------------------
  const shouldHideCancelledTransferred =
    !isArchivedPage;

  // -----------------------------------------
  // Domain expiry visibility
  // Use domain_status, not order_status.
  // -----------------------------------------
  const hideDomainExpiry =
    shouldHideCancelledTransferred &&
    isCancelledOrTransferred(
      order?.domain_status
    );

  // -----------------------------------------
  // Read plans from API response
  // Supports Plans and plans.
  // -----------------------------------------
  const allPlans: any[] = Array.isArray(
    order?.Plans
  )
    ? order.Plans
    : Array.isArray(order?.plans)
      ? order.plans
      : [];

  // -----------------------------------------
  // Plan expiry visibility
  // EXPIRED dates remain visible.
  // -----------------------------------------
  const isPlanExpiryVisible = (
    plan: any
  ): boolean => {
    if (!shouldHideCancelledTransferred) {
      return true;
    }

    const status =
      plan?.primary_status ??
      plan?.primaryStatus ??
      plan?.status;

    return !isCancelledOrTransferred(status);
  };

  // -----------------------------------------
  // Build expiry entries
  // -----------------------------------------
  const expiryEntries: ExpiryEntry[] = [];

  // Domain expiry
  const domainDate = formatDate(
    order?.expiryDate
  );

  const domainKey = getDateKey(
    order?.expiryDate
  );

  if (
    !hideDomainExpiry &&
    domainDate &&
    domainKey
  ) {
    expiryEntries.push({
      type: "domain",
      label: "D",
      date: domainDate,
      key: domainKey,
    });
  }

  // -----------------------------------------
  // Supported plan types
  // -----------------------------------------
  const planTypes = [
    {
      type: "email",
      label: "E",
    },
    {
      type: "hosting",
      label: "H",
    },
    {
      type: "msoffice",
      label: "M",
    },
  ];

  // -----------------------------------------
  // Add plan expiry dates
  // No expired-date filtering.
  // -----------------------------------------
  allPlans.forEach((plan: any) => {
    const planType = String(
      plan?.type ?? ""
    )
      .trim()
      .toLowerCase();

    const typeInfo = planTypes.find(
      (item) => item.type === planType
    );

    if (!typeInfo) return;

    if (!plan?.expiryDate) return;

    if (!isPlanExpiryVisible(plan)) return;

    const date = formatDate(plan.expiryDate);
    const key = getDateKey(plan.expiryDate);

    if (!date || !key) return;

    expiryEntries.push({
      type: typeInfo.type,
      label: typeInfo.label,
      date,
      key,
    });
  });

  // -----------------------------------------
  // Group entries with the same date
  // -----------------------------------------
  const groupedDates = expiryEntries.reduce(
    (
      groups: Record<string, ExpiryEntry[]>,
      item
    ) => {
      if (!groups[item.key]) {
        groups[item.key] = [];
      }

      groups[item.key].push(item);

      return groups;
    },
    {}
  );

  // -----------------------------------------
  // CSS classes
  // -----------------------------------------
  const badgeBase =
    "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium w-fit";

  const iconBase =
    "w-4 h-4 flex justify-center items-center rounded-full bg-white text-black text-[9px]";

  // -----------------------------------------
  // No visible expiry dates
  // -----------------------------------------
  if (expiryEntries.length === 0) {
    return (
      <div className="flex flex-col gap-1">
        <div
          className={`${badgeBase} bg-gray-200 text-gray-500 min-w-[100px]`}
        >
          <span className={iconBase}>-</span>
          N/A
        </div>
      </div>
    );
  }

  // -----------------------------------------
  // Render expiry badges
  // -----------------------------------------
  return (
    <div className="flex flex-col gap-1">
      {Object.entries(groupedDates).map(
        ([dateKey, entries]) => {
          const uniqueTypes = Array.from(
            new Map(
              entries.map((entry) => [
                entry.type,
                entry,
              ])
            ).values()
          );

          const label = uniqueTypes
            .map((entry) => entry.label)
            .join("");

          const displayDate =
            uniqueTypes[0].date;

          const colors = getExpiryColor(dateKey);

          return (
            <div
              key={dateKey}
              className={`${badgeBase} ${colors.bg} ${colors.text}`}
            >
              <span className={iconBase}>
                {label}
              </span>

              {displayDate}
            </div>
          );
        }
      )}
    </div>
  );
}

