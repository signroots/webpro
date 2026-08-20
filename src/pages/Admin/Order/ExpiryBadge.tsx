export default function ExpiryBadge({ order }: any) {
  // -----------------------------------------
  // Format date
  // -----------------------------------------
  const formatDate = (date?: string) => {
    if (!date) return null;

    const d = new Date(date);

    if (isNaN(d.getTime())) return null;

    const day = d.getUTCDate().toString().padStart(2, "0");
    const month = (d.getUTCMonth() + 1).toString().padStart(2, "0");
    const year = d.getUTCFullYear();

    return `${day}/${month}/${year}`;
  };

  // -----------------------------------------
  // Get expiry date in comparable format
  // -----------------------------------------
  const getDateKey = (date?: string) => {
    if (!date) return null;

    const d = new Date(date);

    if (isNaN(d.getTime())) return null;

    return `${d.getUTCFullYear()}-${String(
      d.getUTCMonth() + 1
    ).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  };

  // -----------------------------------------
  // Calculate badge colour based on expiry
  // -----------------------------------------
  const getExpiryColor = (dateKey: string) => {
    const [year, month, day] = dateKey.split("-").map(Number);

    // Use UTC to avoid timezone problems
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
      expiryDate.getTime() - todayUTC.getTime();

    const diffDays = Math.ceil(
      diffMs / (1000 * 60 * 60 * 24)
    );

    // Expired
    if (diffDays < 0) {
      return {
        bg: "bg-red-100",
        text: "text-red-800",
      };
    }

    // Expiring within 15 days
    if (diffDays <= 15) {
      return {
        bg: "bg-orange-100",
        text: "text-orange-800",
      };
    }

    // More than 15 days
    return {
      bg: "bg-green-100",
      text: "text-green-800",
    };
  };

  // -----------------------------------------
  // Get Domain expiry
  // -----------------------------------------
  const domainDate = formatDate(order?.expiryDate);
  const domainKey = getDateKey(order?.expiryDate);

  // -----------------------------------------
  // Get Email expiry dates
  // -----------------------------------------
  const emailPlans = (order?.Plans || []).filter(
    (plan: any) =>
      plan.type?.toLowerCase() === "email" &&
      plan.expiryDate
  );

  // -----------------------------------------
  // Get Hosting expiry dates
  // -----------------------------------------
  const hostingPlans = (order?.Plans || []).filter(
    (plan: any) =>
      plan.type?.toLowerCase() === "hosting" &&
      plan.expiryDate
  );

  // -----------------------------------------
  // Get MS Office expiry dates
  // -----------------------------------------
  const msofficePlans = (order?.Plans || []).filter(
    (plan: any) =>
      plan.type?.toLowerCase() === "msoffice" &&
      plan.expiryDate
  );

  // -----------------------------------------
  // Build all expiry entries
  // -----------------------------------------
  const expiryEntries: {
    type: string;
    label: string;
    date: string;
    key: string;
  }[] = [];

  // Domain
  if (domainDate && domainKey) {
    expiryEntries.push({
      type: "domain",
      label: "D",
      date: domainDate,
      key: domainKey,
    });
  }

  // Email
  emailPlans.forEach((plan: any) => {
    const date = formatDate(plan.expiryDate);
    const key = getDateKey(plan.expiryDate);

    if (date && key) {
      expiryEntries.push({
        type: "email",
        label: "E",
        date,
        key,
      });
    }
  });

  // Hosting
  hostingPlans.forEach((plan: any) => {
    const date = formatDate(plan.expiryDate);
    const key = getDateKey(plan.expiryDate);

    if (date && key) {
      expiryEntries.push({
        type: "hosting",
        label: "H",
        date,
        key,
      });
    }
  });

  // MS Office
  msofficePlans.forEach((plan: any) => {
    const date = formatDate(plan.expiryDate);
    const key = getDateKey(plan.expiryDate);

    if (date && key) {
      expiryEntries.push({
        type: "msoffice",
        label: "M",
        date,
        key,
      });
    }
  });

  // -----------------------------------------
  // Group same expiry dates
  // -----------------------------------------
  const groupedDates = expiryEntries.reduce(
    (groups: Record<string, typeof expiryEntries>, item) => {
      if (!groups[item.key]) {
        groups[item.key] = [];
      }

      groups[item.key].push(item);

      return groups;
    },
    {}
  );

  // -----------------------------------------
  // Badge base classes
  // -----------------------------------------
  const badgeBase =
    "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium w-fit";

  const iconBase =
    "w-4 h-4 flex justify-center items-center rounded-full bg-white text-black text-[9px]";

  // -----------------------------------------
  // No expiry dates
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
  // Render
  // -----------------------------------------
  return (
    <div className="flex flex-col gap-1">
      {Object.entries(groupedDates).map(
        ([dateKey, entries]) => {
          /*
           * Remove duplicate service types for same date.
           *
           * Example:
           * Domain 20/08/2026
           * Email  20/08/2026
           * Email  20/08/2026
           *
           * Result:
           * DE
           */
          const uniqueTypes = Array.from(
            new Map(
              entries.map((entry) => [
                entry.type,
                entry,
              ])
            ).values()
          );

          // -----------------------------------------
          // Create badge label
          // -----------------------------------------
          const label = uniqueTypes
            .map((entry) => entry.label)
            .join("");

          // -----------------------------------------
          // Date to display
          // -----------------------------------------
          const displayDate = uniqueTypes[0].date;

          // -----------------------------------------
          // Colour based on expiry
          // -----------------------------------------
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
