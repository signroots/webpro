export default function ExpiryBadge({
  order,
  isArchivedPage = false,
}: {
  order: any;
  isArchivedPage?: boolean;
}) {
  // -----------------------------------------
  // Format date
  // -----------------------------------------
  const formatDate = (date?: string) => {
    if (!date) return null;

    const d = new Date(date);

    if (isNaN(d.getTime())) return null;

    const day = d.getUTCDate().toString().padStart(2, "0");
    const month = (d.getUTCMonth() + 1)
      .toString()
      .padStart(2, "0");
    const year = d.getUTCFullYear();

    return `${day}/${month}/${year}`;
  };

  // -----------------------------------------
  // Get expiry date key
  // -----------------------------------------
  const getDateKey = (date?: string) => {
    if (!date) return null;

    const d = new Date(date);

    if (isNaN(d.getTime())) return null;

    return `${d.getUTCFullYear()}-${String(
      d.getUTCMonth() + 1
    ).padStart(2, "0")}-${String(
      d.getUTCDate()
    ).padStart(2, "0")}`;
  };

  // -----------------------------------------
  // Get expiry status + colour
  // -----------------------------------------
  const getExpiryColor = (dateKey: string) => {
    const [year, month, day] = dateKey
      .split("-")
      .map(Number);

    const expiryDate = new Date(
      Date.UTC(year, month - 1, day)
    );

    const today = new Date();

    const todayUTC = new Date(
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate()
      )
    );

    const diffMs =
      expiryDate.getTime() -
      todayUTC.getTime();

    const diffDays = Math.ceil(
      diffMs / (1000 * 60 * 60 * 24)
    );

    // Expired
    if (diffDays < 0) {
      return {
        bg: "bg-red-100",
        text: "text-red-800",
        expired: true,
      };
    }

    // Expiring within 15 days
    if (diffDays <= 15) {
      return {
        bg: "bg-orange-100",
        text: "text-orange-800",
        expired: false,
      };
    }

    // More than 15 days
    return {
      bg: "bg-green-100",
      text: "text-green-800",
      expired: false,
    };
  };

  // -----------------------------------------
  // Get status name
  // -----------------------------------------
  const getStatusName = (status: any) => {
    if (!status) return "";

    if (typeof status === "string") {
      return status.toUpperCase();
    }

    return (
      status?.name ||
      status?.code ||
      ""
    ).toUpperCase();
  };

  // -----------------------------------------
  // Domain expiry
  // -----------------------------------------
  const domainDate = formatDate(
    order?.expiryDate
  );

  const domainKey = getDateKey(
    order?.expiryDate
  );

  // Domain status
  const domainStatus = getStatusName(
    order?.domain_status
  );

  // -----------------------------------------
  // Email expiry
  // -----------------------------------------
  const emailPlans = (
    order?.Plans || []
  ).filter(
    (plan: any) =>
      plan.type?.toLowerCase() === "email" &&
      plan.expiryDate
  );

  // -----------------------------------------
  // Hosting expiry
  // -----------------------------------------
  const hostingPlans = (
    order?.Plans || []
  ).filter(
    (plan: any) =>
      plan.type?.toLowerCase() === "hosting" &&
      plan.expiryDate
  );

  // -----------------------------------------
  // MS Office expiry
  // -----------------------------------------
  const msofficePlans = (
    order?.Plans || []
  ).filter(
    (plan: any) =>
      plan.type?.toLowerCase() === "msoffice" &&
      plan.expiryDate
  );

  // -----------------------------------------
  // Build expiry entries
  // -----------------------------------------
  const expiryEntries: {
    type: string;
    label: string;
    date: string;
    key: string;
    status: string;
  }[] = [];

  // -----------------------------------------
  // Domain
  // -----------------------------------------
  if (domainDate && domainKey) {
    expiryEntries.push({
      type: "domain",
      label: "D",
      date: domainDate,
      key: domainKey,
      status: domainStatus,
    });
  }

  // -----------------------------------------
  // Email
  // -----------------------------------------
  emailPlans.forEach((plan: any) => {
    const date = formatDate(
      plan.expiryDate
    );

    const key = getDateKey(
      plan.expiryDate
    );

    const status = getStatusName(
      plan.primary_status ||
      plan.primaryStatus ||
      plan.status
    );

    if (date && key) {
      expiryEntries.push({
        type: "email",
        label: "E",
        date,
        key,
        status,
      });
    }
  });

  // -----------------------------------------
  // Hosting
  // -----------------------------------------
  hostingPlans.forEach((plan: any) => {
    const date = formatDate(
      plan.expiryDate
    );

    const key = getDateKey(
      plan.expiryDate
    );

    const status = getStatusName(
      plan.primary_status ||
      plan.primaryStatus ||
      plan.status
    );

    if (date && key) {
      expiryEntries.push({
        type: "hosting",
        label: "H",
        date,
        key,
        status,
      });
    }
  });

  // -----------------------------------------
  // MS Office
  // -----------------------------------------
  msofficePlans.forEach((plan: any) => {
    const date = formatDate(
      plan.expiryDate
    );

    const key = getDateKey(
      plan.expiryDate
    );

    const status = getStatusName(
      plan.primary_status ||
      plan.primaryStatus ||
      plan.status
    );

    if (date && key) {
      expiryEntries.push({
        type: "msoffice",
        label: "M",
        date,
        key,
        status,
      });
    }
  });

  // -----------------------------------------
  // PAGE-SPECIFIC FILTER
  // -----------------------------------------
  const filteredExpiryEntries =
    expiryEntries.filter((entry) => {
      const colors = getExpiryColor(
        entry.key
      );

      // =====================================
      // ARCHIVED ORDER PAGE
      // =====================================
      //
      // Show expiry date when service/domain
      // is CANCELLED or TRANSFERRED.
      //
      // ACTIVE must NOT be shown.
      //
      if (isArchivedPage) {
        return (
          entry.status === "CANCELLED" ||
          entry.status === "TRANSFERRED"
        );
      }

      // =====================================
      // NORMAL ORDER PAGE
      // =====================================
      //
      // Show only active/future expiry dates.
      //
      return !colors.expired;
    });

  // -----------------------------------------
  // Group same expiry dates
  // -----------------------------------------
  const groupedDates =
    filteredExpiryEntries.reduce(
      (
        groups: Record<
          string,
          typeof filteredExpiryEntries
        >,
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
  // Badge classes
  // -----------------------------------------
  const badgeBase =
    "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium w-fit";

  const iconBase =
    "w-4 h-4 flex justify-center items-center rounded-full bg-white text-black text-[9px]";

  // -----------------------------------------
  // No matching expiry dates
  // -----------------------------------------
  if (
    filteredExpiryEntries.length === 0
  ) {
    return (
      <div className="flex flex-col gap-1">
        <div
          className={`${badgeBase} bg-gray-200 text-gray-500 min-w-[100px]`}
        >
          <span className={iconBase}>
            -
          </span>

          N/A
        </div>
      </div>
    );
  }

  // -----------------------------------------
  // Render
  // -----------------------------------------
  return (
    <div className="flex flex-col gap-1">
      {Object.entries(
        groupedDates
      ).map(
        ([dateKey, entries]) => {
          // Remove duplicate service types
          const uniqueTypes =
            Array.from(
              new Map(
                entries.map(
                  (entry) => [
                    entry.type,
                    entry,
                  ]
                )
              ).values()
            );

          // Create label
          const label =
            uniqueTypes
              .map(
                (entry) =>
                  entry.label
              )
              .join("");

          // Get colour
          const colors =
            getExpiryColor(
              dateKey
            );

          return (
            <div
              key={dateKey}
              className={`${badgeBase} ${colors.bg} ${colors.text}`}
            >
              <span
                className={iconBase}
              >
                {label}
              </span>

              <span>
                {
                  uniqueTypes[0]
                    .date
                }
              </span>
            </div>
          );
        }
      )}
    </div>
  );
}