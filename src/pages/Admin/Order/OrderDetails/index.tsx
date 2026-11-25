import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { notify } from "../../../../Common/Toastify";
import { getLabelColor } from "../../../../utils/labelColors";
import {
  fetchOrderById,
  updateOrderStatus,
  updatePlanStatus,
  fetchOrderStatuses,
  fetchPrimaryPlanStatuses,
  fetchDomainStatuses,
  fetchActiveLabels,
  updateOrderLabel,
  updateOrderPlanLabel,
  LabelInfo,
} from "../api";

import {
  FaArrowLeft,
  FaEdit,
  FaRedo,
  FaTimes,
  FaCopy,
  FaUsers,
  FaPlus,
  FaMinus,
} from "react-icons/fa";

/* ===================== TYPES ===================== */

type LabelValue = LabelInfo | string;

interface Plan {
  _id: string;
  planName: string;
  serviceType: string;
  type: string;
  registrationDate: string;
  expiryDate: string;
  provider?: string;
  noOfUsers?: number;
  orderId: string;
  planId: string;
  emailType?: string;
  adminEmail?: string;
  adminPassword?: string;
  username?: string;
  monthly_renewlaed?: boolean;
  labels?: LabelValue[];
  label?: LabelInfo | string | null;
  primary_status?: {
    _id: string;
    name: string;
    code?: string;
    type?: string;
    category?: "primary" | "secondary";
    is_active?: boolean;
    is_custom?: boolean;
  } | null;
}

interface Customer {
  name?: string;
  email?: string | string[];
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface Client {
  name?: string;
  email?: string | string[];
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface DomainSource {
  _id: string;
  name: string;
  code: string;
  image?: string;
}

interface Status {
  _id: string;
  name: string;
  code?: string;
  category?: "primary" | "secondary";
  is_active: boolean;
  typeEmail?: {
    _id: string;
    name: string;
  } | null;
}

interface Order {
  _id: string;
  domainName: string;
  labels?: LabelValue[];
  label?: LabelInfo | string | null;
  status?: {
    _id: string;
    name: string;
  } | null;
  order_status?: {
    _id: string;
    name: string;
    code: string;
    type: string;
    is_active: boolean;
  } | null;
  domain_status?: {
    _id: string;
    name: string;
    code: string;
    type: string;
    is_active: boolean;
  } | null;
  managedBy?: string;
  registrationDate?: string;
  expiryDate?: string;
  provider?: string;
  domainSource?: DomainSource | null;
  domain_flag?: boolean;
  email_flag?: boolean;
  host_flag?: boolean;
  ssl_flag?: boolean;
  website_flag?: boolean;
  storage_services_flag?: boolean;
  lockStatus?: string;
  email_status?: string;
  businessEmail?: boolean;
  cloudflareRegistered?: boolean;
  google_email?: boolean;
  microsoft_email?: boolean;
  username?: string;
  nameServers?: string[];
  customer?: Customer;
  client?: Client;
  plans?: Plan[];
}

type RenewalTarget = "domain" | "plan";
type RenewalDuration = 1 | 12;
type RenewStep = "dates" | "confirm";

interface RenewalItem {
  key: string;
  target: RenewalTarget;
  label: string;
  planId?: string;
  currentExpiry?: string | null;
  durationMonths: RenewalDuration;
  monthlyLocked?: boolean;
}

/* ===================== CONSTANTS ===================== */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/* ===================== DATE HELPERS ===================== */

const toDateInputValue = (
  value?: string | Date | null
): string => {
  if (!value) return "";

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";

    return [
      value.getFullYear(),
      String(value.getMonth() + 1).padStart(2, "0"),
      String(value.getDate()).padStart(2, "0"),
    ].join("-");
  }

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (isoMatch) {
    const [, year, month, day] = isoMatch;

    const parsed = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    if (
      parsed.getFullYear() !== Number(year) ||
      parsed.getMonth() !== Number(month) - 1 ||
      parsed.getDate() !== Number(day)
    ) {
      return "";
    }

    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "";

  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, "0"),
    String(parsed.getDate()).padStart(2, "0"),
  ].join("-");
};

const addMonthsSafely = (
  date: Date,
  months: number
): Date => {
  const result = new Date(date);
  const originalDay = result.getDate();

  result.setDate(1);
  result.setMonth(result.getMonth() + months);

  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0
  ).getDate();

  result.setDate(Math.min(originalDay, lastDay));

  return result;
};

const calculateNewExpiry = (
  currentExpiry: string | null | undefined,
  durationMonths: number
): string => {
  const currentInput = toDateInputValue(currentExpiry);

  let baseDate: Date;

  if (currentInput) {
    const [year, month, day] = currentInput.split("-").map(Number);

    baseDate = new Date(year, month - 1, day, 12, 0, 0);
  } else {
    const today = new Date();

    baseDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      12,
      0,
      0
    );
  }

  return toDateInputValue(
    addMonthsSafely(baseDate, durationMonths)
  );
};

const displayDate = (value?: string | null): string => {
  const date = toDateInputValue(value);

  if (!date) return "Not available";

  const [year, month, day] = date.split("-");

  return `${day}-${month}-${year}`;
};

/* ===================== INFO COMPONENT ===================== */

const Info: React.FC<{
  label: string;
  value?: any;
}> = ({ label, value }) => (
  <div className="min-w-0">
    <p className="mb-1.5 text-sm font-medium text-gray-500">
      {label}
    </p>

    <p className="break-words text-base font-semibold text-gray-900">
      {Array.isArray(value)
        ? value.join(", ") || "-"
        : value ?? "-"}
    </p>
  </div>
);

/* ===================== MAIN COMPONENT ===================== */

const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  /* ===================== STATES ===================== */

  const [statuses, setStatuses] = useState<Status[]>([]);
  const [domainStatuses, setDomainStatuses] = useState<Status[]>([]);

  const [primaryPlanStatuses, setPrimaryPlanStatuses] =
    useState<Record<string, Status[]>>({});

  const [order, setOrder] = useState<Order | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ===================== LABEL STATES ===================== */
const [orderLabelChanged, setOrderLabelChanged] = useState(false);
  const [labelLoading, setLabelLoading] = useState(false);

  const [labelModalOpen, setLabelModalOpen] = useState(false);

  const [selectedOrderLabels, setSelectedOrderLabels] =
    useState<string[]>([]);

  const [labelUpdating, setLabelUpdating] = useState(false);
const [labelSuccess, setLabelSuccess] = useState("");
  const [orderLabels, setOrderLabels] = useState<LabelInfo[]>([]);
  const [planLabels, setPlanLabels] = useState<LabelInfo[]>([]);

  const [planLabelSelections, setPlanLabelSelections] =
    useState<Record<string, string[]>>({});

  const [savingPlanLabel, setSavingPlanLabel] = useState<string | null>(
    null
  );

  const [planLabelModalOpen, setPlanLabelModalOpen] = useState(false);
  const [activePlanLabelId, setActivePlanLabelId] = useState<string | null>(
    null
  );

  /* ===================== LABEL HELPERS ===================== */

  const getLabelIds = (
    labels?: LabelValue[] | LabelValue | null
  ): string[] => {
    if (!labels) return [];

    const normalizedLabels = Array.isArray(labels)
      ? labels
      : [labels];

    return normalizedLabels
      .map((label) =>
        typeof label === "string" ? label : label?._id || ""
      )
      .filter(Boolean);
  };

  const getLabelNames = (
    labels?: LabelValue[] | LabelValue | null,
    availableLabels: LabelInfo[] = []
  ): string => {
    if (!labels) return "-";

    const normalizedLabels = Array.isArray(labels)
      ? labels
      : [labels];

    const names = normalizedLabels
      .map((label) => {
        if (typeof label === "object") {
          return label.statusLabelName || "";
        }

        const matchedLabel = availableLabels.find(
          (item) => item._id === label
        );

        return matchedLabel?.statusLabelName || "";
      })
      .filter(Boolean);

    return names.length ? names.join(", ") : "-";
  };

  /* ===================== LOAD ACTIVE LABELS ===================== */

  const loadActiveLabels = async () => {
    try {
      setLabelLoading(true);

      const [orderData, planData] = await Promise.all([
        fetchActiveLabels("ORDER"),
        fetchActiveLabels("PLAN"),
      ]);

      setOrderLabels(Array.isArray(orderData) ? orderData : []);
      setPlanLabels(Array.isArray(planData) ? planData : []);
    } catch (labelError) {
      console.error("Failed to load active labels:", labelError);
      alert("Failed to load active labels.");
    } finally {
      setLabelLoading(false);
    }
  };

  /* ===================== ORDER LABEL MODAL ===================== */

const openLabelModal = () => {
  if (!order) return;

  setSelectedOrderLabels(
    getLabelIds(order.labels ?? order.label)
  );

  setOrderLabelChanged(false);
  setLabelModalOpen(true);
};

  const handleOrderLabelSelection = (
    labelId: string,
    checked: boolean
  ) => {
    setSelectedOrderLabels((previous) => {
      if (checked) {
        return previous.includes(labelId)
          ? previous
          : [...previous, labelId];
      }

      return previous.filter((id) => id !== labelId);
    });
  };

  const handleOrderLabelUpdate = async () => {
    if (!order) return;

    try {
      setLabelUpdating(true);

      const labelIds = selectedOrderLabels;

      await updateOrderLabel(order._id, labelIds);

      const updatedLabels = orderLabels.filter((label) =>
        labelIds.includes(label._id)
      );

      setOrder((previous) =>
        previous
          ? {
            ...previous,
            labels: updatedLabels,
            label: undefined,
          }
          : previous
      );

      setLabelModalOpen(false);

      notify("Order labels updated successfully.","success");
    } catch (labelError: any) {
      console.error("Order label update error:", labelError);

      notify(
        labelError?.response?.data?.message ||
        "Failed to update order labels.","error"
      );
    } finally {
      setLabelUpdating(false);
    }
  };

  /* ===================== PLAN LABEL MODAL ===================== */

  const openPlanLabelModal = (plan: Plan) => {
    setActivePlanLabelId(plan._id);

    setPlanLabelSelections((previous) => ({
      ...previous,
      [plan._id]: getLabelIds(plan.labels ?? plan.label),
    }));

    setPlanLabelModalOpen(true);
  };

  const handlePlanLabelSelection = (
    planId: string,
    labelId: string,
    checked: boolean
  ) => {
    setPlanLabelSelections((previous) => {
      const currentLabels = previous[planId] || [];

      const updatedLabels = checked
        ? currentLabels.includes(labelId)
          ? currentLabels
          : [...currentLabels, labelId]
        : currentLabels.filter((id) => id !== labelId);

      return {
        ...previous,
        [planId]: updatedLabels,
      };
    });
  };

  /* ===================== SAVE PLAN LABELS ===================== */

  const handlePlanLabelUpdate = async (
    planId: string
  ): Promise<boolean> => {
    if (!order) return false;

    const originalPlan = order.plans?.find(
      (plan) => plan._id === planId
    );

    const labelIds = planLabelSelections[planId] || [];

    try {
      setSavingPlanLabel(planId);

      await updateOrderPlanLabel(planId, labelIds);

      const updatedLabels = planLabels.filter((label) =>
        labelIds.includes(label._id)
      );

      setOrder((previous) =>
        previous
          ? {
            ...previous,
            plans: previous.plans?.map((plan) =>
              plan._id === planId
                ? {
                  ...plan,
                  labels: updatedLabels,
                  label: undefined,
                }
                : plan
            ),
          }
          : previous
      );

      notify("Plan labels updated successfully.","success");

      return true;
    } catch (labelError: any) {
      console.error("Plan label update error:", labelError);

      notify(
        labelError?.response?.data?.message ||
        "Failed to update plan labels.","error"
      );

      setPlanLabelSelections((previous) => ({
        ...previous,
        [planId]: getLabelIds(
          originalPlan?.labels ?? originalPlan?.label
        ),
      }));

      return false;
    } finally {
      setSavingPlanLabel(null);
    }
  };

  const handleSavePlanLabels = async () => {
    if (!activePlanLabelId) return;

    const success = await handlePlanLabelUpdate(activePlanLabelId);

    if (success) {
      setPlanLabelModalOpen(false);
      setActivePlanLabelId(null);
    }
  };

  useEffect(() => {
    loadActiveLabels();
  }, []);

  /* ===================== STATUS MODAL ===================== */

  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const [updateOrderStatusChecked, setUpdateOrderStatusChecked] =
    useState(false);

  const [updateDomainStatusChecked, setUpdateDomainStatusChecked] =
    useState(false);

  const [updatePlanStatusChecked, setUpdatePlanStatusChecked] =
    useState(false);

  const [selectedOrderStatus, setSelectedOrderStatus] = useState("");
  const [selectedDomainStatus, setSelectedDomainStatus] = useState("");

  const [selectedPrimaryPlanStatuses, setSelectedPrimaryPlanStatuses] =
    useState<Record<string, string>>({});

  const [statusUpdating, setStatusUpdating] = useState(false);

  /* ===================== COPY FEEDBACK ===================== */

  const [copyFeedback, setCopyFeedback] = useState<{
    key: string;
    message: string;
    success: boolean;
  } | null>(null);

  const copyTimeoutRef =
    React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const copyToClipboard = async (
    value: string,
    label: string,
    planId: string
  ) => {
    const key = `${planId}-${label}`;

    try {
      await navigator.clipboard.writeText(value);

      setCopyFeedback({
        key,
        message: "Copied",
        success: true,
      });
    } catch (copyError) {
      console.error("Copy failed:", copyError);

      setCopyFeedback({
        key,
        message: "Copy failed",
        success: false,
      });
    }

    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }

    copyTimeoutRef.current = setTimeout(() => {
      setCopyFeedback(null);
      copyTimeoutRef.current = null;
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  /* ===================== MANAGE LICENCES ===================== */

  const [licenseModalOpen, setLicenseModalOpen] = useState(false);

  const [licenseConfirmModalOpen, setLicenseConfirmModalOpen] =
    useState(false);

  const [selectedLicensePlanId, setSelectedLicensePlanId] = useState("");

  const [newLicenseTotalInput, setNewLicenseTotalInput] = useState("0");

  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState("");

  const [licenseUpdating, setLicenseUpdating] = useState(false);

  const selectedLicensePlan = (order?.plans || []).find(
    (plan) => plan._id === selectedLicensePlanId
  );

  const currentLicenseCount = selectedLicensePlan?.noOfUsers ?? 0;

  const newLicenseTotal = Number(newLicenseTotalInput);

  const licenseDelta = newLicenseTotal - currentLicenseCount;

  const isLicenseTotalValid =
    newLicenseTotalInput.trim() !== "" &&
    Number.isInteger(newLicenseTotal) &&
    newLicenseTotal >= 1 &&
    newLicenseTotal <= 300 &&
    licenseDelta !== 0;

  const openLicenseModal = (plan: Plan) => {
    setSelectedLicensePlanId(plan._id);
    setNewLicenseTotalInput(String(plan.noOfUsers ?? 0));
    setPurchaseOrderNumber("");
    setLicenseConfirmModalOpen(false);
    setLicenseModalOpen(true);
  };

  const changeLicenseTotal = (change: number) => {
    setNewLicenseTotalInput((prev) => {
      const current = Number(prev);

      const safeCurrent = Number.isInteger(current)
        ? current
        : currentLicenseCount;

      const next = Math.min(300, Math.max(1, safeCurrent + change));

      return String(next);
    });
  };

  const handleContinueLicenses = () => {
    if (!selectedLicensePlan) {
      alert("Please select a plan.");
      return;
    }

    if (!isLicenseTotalValid) {
      alert("Please change the licence total between 1 and 300.");
      return;
    }

    setLicenseModalOpen(false);
    setLicenseConfirmModalOpen(true);
  };

  const handleConfirmLicenses = async () => {
    if (!selectedLicensePlan) {
      alert("Please select a plan.");
      return;
    }

    if (!isLicenseTotalValid) {
      alert("Please select a valid licence total between 1 and 300.");
      setLicenseConfirmModalOpen(false);
      setLicenseModalOpen(true);
      return;
    }

    try {
      setLicenseUpdating(true);

      const response = await fetch(
        `${API_BASE_URL}/api/orders/${selectedLicensePlan._id}/licenses`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            additionalLicenses: licenseDelta,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to update licences."
        );
      }

      const updatedUsers = result.data?.noOfUsers ?? newLicenseTotal;

      setOrder((prev) =>
        prev
          ? {
            ...prev,
            plans: prev.plans?.map((plan) =>
              plan._id === selectedLicensePlan._id
                ? {
                  ...plan,
                  noOfUsers: updatedUsers,
                }
                : plan
            ),
          }
          : prev
      );

      setLicenseConfirmModalOpen(false);
      setLicenseModalOpen(false);

      notify("Licences updated successfully.");
    } catch (licenseError) {
      console.error("Licence update error:", licenseError);

      notify(
        licenseError instanceof Error
          ? licenseError.message
          : "Failed to update licences."
      );
    } finally {
      setLicenseUpdating(false);
    }
  };

  /* ===================== RENEWAL STATES ===================== */

  const [renewOrder, setRenewOrder] = useState<Order | null>(null);

  const [renewDates, setRenewDates] = useState<Record<string, string>>({});

  const [renewalDurations, setRenewalDurations] =
    useState<Record<string, RenewalDuration>>({});

  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const [renewStep, setRenewStep] = useState<RenewStep>("dates");

  const [renewUpdating, setRenewUpdating] = useState(false);

  const [renewError, setRenewError] = useState("");

  const [renewSuccess, setRenewSuccess] = useState("");

  /* ===================== GET RENEWAL ITEMS ===================== */

  const getRenewalItems = (currentOrder: Order): RenewalItem[] => {
    const items: RenewalItem[] = [];

    if (currentOrder.domainSource?._id && currentOrder.expiryDate) {
      items.push({
        key: "domain",
        target: "domain",
        label: `Domain — ${currentOrder.domainName}`,
        currentExpiry: currentOrder.expiryDate,
        durationMonths: 12,
      });
    }

    (currentOrder.plans || []).forEach((plan) => {
      if (!plan._id || !plan.expiryDate) return;

      const monthlyLocked = plan.monthly_renewlaed === true;

      items.push({
        key: `plan-${plan._id}`,
        target: "plan",
        planId: plan._id,
        label: `${(plan.type || "Plan").toUpperCase()} Plan`,
        currentExpiry: plan.expiryDate,
        durationMonths: monthlyLocked ? 1 : 12,
        monthlyLocked,
      });
    });

    return items;
  };

  /* ===================== OPEN RENEW POPUP ===================== */

  const openRenewModal = () => {
    if (!order) return;

    const items = getRenewalItems(order);

    if (!items.length) {
      alert("No renewable domain or service plan was found.");
      return;
    }

    const dates: Record<string, string> = {};
    const durations: Record<string, RenewalDuration> = {};

    items.forEach((item) => {
      durations[item.key] = item.durationMonths;

      dates[item.key] = calculateNewExpiry(
        item.currentExpiry,
        item.durationMonths
      );
    });

    setRenewOrder(order);
    setRenewDates(dates);
    setRenewalDurations(durations);
    setSelectedItems(items.map((item) => item.key));

    setRenewStep("dates");
    setRenewError("");
    setRenewSuccess("");
  };

  /* ===================== CLOSE RENEW POPUP ===================== */

  const closeRenewModal = () => {
    if (renewUpdating) return;

    setRenewOrder(null);
    setRenewDates({});
    setRenewalDurations({});
    setSelectedItems([]);
    setRenewStep("dates");
    setRenewError("");
  };

  /* ===================== RENEWAL ITEM DATA ===================== */

  const renewalItems = renewOrder
    ? getRenewalItems(renewOrder)
    : [];

  const itemsWithSelectedDuration = renewalItems.map((item) => ({
    ...item,
    durationMonths:
      renewalDurations[item.key] ?? item.durationMonths,
  }));

  const selectedRenewalItems = itemsWithSelectedDuration.filter((item) =>
    selectedItems.includes(item.key)
  );

  /* ===================== TOGGLE RENEWAL ITEM ===================== */

  const toggleRenewalItem = (key: string, checked: boolean) => {
    setSelectedItems((previous) =>
      checked
        ? [...previous, key]
        : previous.filter((item) => item !== key)
    );

    setRenewError("");
  };

  /* ===================== CHANGE RENEWAL DURATION ===================== */

  const handleDurationChange = (
    item: RenewalItem,
    duration: RenewalDuration
  ) => {
    if (item.monthlyLocked) return;

    setRenewalDurations((previous) => ({
      ...previous,
      [item.key]: duration,
    }));

    setRenewDates((previous) => ({
      ...previous,
      [item.key]: calculateNewExpiry(
        item.currentExpiry,
        duration
      ),
    }));

    setRenewError("");
  };

  /* ===================== CHANGE RENEWAL DATE ===================== */

  const changeRenewalDate = (key: string, date: string) => {
    setRenewDates((previous) => ({
      ...previous,
      [key]: date,
    }));

    setRenewError("");
  };

  /* ===================== CONTINUE RENEWAL ===================== */

  const handleContinueRenewal = () => {
    if (!selectedRenewalItems.length) {
      setRenewError("Select at least one service to renew.");
      return;
    }

    for (const item of selectedRenewalItems) {
      const selectedDate = renewDates[item.key];

      if (
        !selectedDate ||
        !/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)
      ) {
        setRenewError(
          `Select a valid expiry date for ${item.label}.`
        );
        return;
      }

      const [year, month, day] = selectedDate.split("-").map(Number);

      const parsed = new Date(year, month - 1, day);

      if (
        parsed.getFullYear() !== year ||
        parsed.getMonth() !== month - 1 ||
        parsed.getDate() !== day
      ) {
        setRenewError(
          `Select a valid expiry date for ${item.label}.`
        );
        return;
      }

      const minimumDate = toDateInputValue(new Date());

      if (selectedDate < minimumDate) {
        setRenewError(
          `The new expiry date for ${item.label} cannot be in the past.`
        );
        return;
      }

      if (item.monthlyLocked && item.durationMonths !== 1) {
        setRenewError(
          `${item.label} is configured for monthly renewal only.`
        );
        return;
      }
    }

    setRenewError("");
    setRenewStep("confirm");
  };

  /* ===================== CONFIRM RENEWAL ===================== */

  const handleConfirmRenewal = async () => {
    if (!renewOrder || !selectedRenewalItems.length) {
      setRenewError("Select at least one service to renew.");
      return;
    }

    try {
      setRenewUpdating(true);
      setRenewError("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/orders/${renewOrder._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            renewals: selectedRenewalItems.map((item) => ({
              target: item.target,
              ...(item.target === "plan"
                ? { planId: item.planId }
                : {}),
              durationMonths: item.durationMonths,
              expiryDate: renewDates[item.key],
            })),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Renewal failed.");
      }

      setOrder((previous) => {
        if (!previous) return previous;

        const updatedOrder: Order = {
          ...previous,
          plans: [...(previous.plans || [])],
        };

        selectedRenewalItems.forEach((item) => {
          if (item.target === "domain") {
            updatedOrder.expiryDate = renewDates[item.key];
          }

          if (item.target === "plan" && item.planId) {
            updatedOrder.plans = updatedOrder.plans?.map((plan) =>
              plan._id === item.planId
                ? {
                  ...plan,
                  expiryDate: renewDates[item.key],
                }
                : plan
            );
          }
        });

        return updatedOrder;
      });

      setRenewSuccess("Renewal completed successfully.");

      setRenewOrder(null);
      setRenewDates({});
      setRenewalDurations({});
      setSelectedItems([]);
      setRenewStep("dates");
    } catch (renewError) {
      console.error("Renewal error:", renewError);

      setRenewError(
        renewError instanceof Error
          ? renewError.message
          : "Failed to renew selected services."
      );
    } finally {
      setRenewUpdating(false);
    }
  };

  /* ===================== OPEN STATUS MODAL ===================== */

  const openStatusModal = () => {
    setSelectedOrderStatus(order?.order_status?._id || "");
    setSelectedDomainStatus(order?.domain_status?._id || "");

    const primary: Record<string, string> = {};

    (order?.plans || []).forEach((plan) => {
      primary[plan._id] = plan.primary_status?._id || "";
    });

    setSelectedPrimaryPlanStatuses(primary);

    setUpdateOrderStatusChecked(false);
    setUpdateDomainStatusChecked(false);
    setUpdatePlanStatusChecked(false);

    setStatusModalOpen(true);
  };

  /* ===================== HANDLE STATUS UPDATE ===================== */

  const handleStatusUpdate = async () => {
    if (!order) return;

    if (
      !updateOrderStatusChecked &&
      !updateDomainStatusChecked &&
      !updatePlanStatusChecked
    ) {
      alert("Please select at least one status to update");
      return;
    }

    try {
      setStatusUpdating(true);

      if (
        updateOrderStatusChecked &&
        selectedOrderStatus &&
        selectedOrderStatus !== order.order_status?._id
      ) {
        const updatedOrder = await updateOrderStatus(order._id, {
          order_status: selectedOrderStatus,
        });

        setOrder((previous) =>
          previous
            ? {
              ...previous,
              order_status: updatedOrder.order_status,
            }
            : previous
        );
      }

      if (
        updateDomainStatusChecked &&
        selectedDomainStatus &&
        selectedDomainStatus !== order.domain_status?._id
      ) {
        const updatedOrder = await updateOrderStatus(order._id, {
          domain_status: selectedDomainStatus,
        });

        setOrder((previous) =>
          previous
            ? {
              ...previous,
              domain_status: updatedOrder.domain_status,
            }
            : previous
        );
      }

      if (updatePlanStatusChecked) {
        for (const plan of order.plans || []) {
          if (!plan.emailType) continue;

          const primaryStatus =
            selectedPrimaryPlanStatuses[plan._id] || "";

          const primaryChanged =
            primaryStatus !== (plan.primary_status?._id || "");

          if (!primaryChanged) continue;

          const payload: { primary_status?: string } = {};

          if (primaryChanged && primaryStatus) {
            payload.primary_status = primaryStatus;
          }

          const updatedPlan = await updatePlanStatus(
            plan._id,
            payload
          );

          setOrder((previous) => {
            if (!previous) return previous;

            return {
              ...previous,
              plans: previous.plans?.map((currentPlan) =>
                currentPlan._id === plan._id
                  ? {
                    ...currentPlan,
                    primary_status: updatedPlan.primary_status,
                  }
                  : currentPlan
              ),
            };
          });
        }
      }

      setStatusModalOpen(false);
      notify("Status updated successfully");
    } catch (statusError) {
      console.error("Status update error:", statusError);
     notify("Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  /* ===================== LOAD ORDER ===================== */

  useEffect(() => {
    if (!orderId) return;

    const loadOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchOrderById(orderId);

        const mapPerson = (source: any) =>
          source
            ? {
              name: source.c_name,
              email: source.c_email,
              phone: source.c_phone,
              company: source.c_company,
              address: source.c_address,
              city: source.c_city,
              state: source.c_state?.name,
              country: source.c_country?.name,
            }
            : undefined;

        const mappedOrder: Order = {
          ...data,
          domainSource: data.domainSource || null,
          customer: mapPerson(data.customer),
          client: mapPerson(data.client),
        };

        setOrder(mappedOrder);

        const planSelections: Record<string, string[]> = {};

        (mappedOrder.plans || []).forEach((plan) => {
          planSelections[plan._id] = getLabelIds(
            plan.labels ?? plan.label
          );
        });

        setPlanLabelSelections(planSelections);

        setSelectedOrderLabels(
          getLabelIds(mappedOrder.labels ?? mappedOrder.label)
        );

        const orderStatusData = await fetchOrderStatuses(orderId);

        setStatuses(
          Array.isArray(orderStatusData) ? orderStatusData : []
        );

        const domainStatusData = await fetchDomainStatuses(orderId);

        setDomainStatuses(
          Array.isArray(domainStatusData) ? domainStatusData : []
        );

        const primaryStatuses = await fetchPrimaryPlanStatuses();

        const primaryStatusMap: Record<string, Status[]> = {};

        for (const plan of mappedOrder.plans || []) {
          primaryStatusMap[plan._id] = Array.isArray(primaryStatuses)
            ? primaryStatuses
            : [];
        }

        setPrimaryPlanStatuses(primaryStatusMap);
      } catch (loadError) {
        console.error("Failed to load order details:", loadError);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    loadOrderDetails();
  }, [orderId]);

  /* ===================== SECTION COMPONENT ===================== */

  const Section: React.FC<{
    title: string;
    children: React.ReactNode;
    fullWidth?: boolean;
    rightContent?: React.ReactNode;
  }> = ({ title, children, fullWidth, rightContent }) => (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-2">
        <h2 className="text-sm font-semibold text-gray-900">
          {title}
        </h2>

        {rightContent}
      </div>

      <div
        className={
          fullWidth
            ? ""
            : "grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2"
        }
      >
        {children}
      </div>
    </section>
  );

  /* ===================== LOADING ===================== */

  if (loading) {
    return <p className="p-6">Loading order details...</p>;
  }

  /* ===================== ERROR ===================== */

  if (error) {
    return <p className="p-6 text-red-600">{error}</p>;
  }

  /* ===================== NO ORDER ===================== */

  if (!order) {
    return <p className="p-6">Order not found</p>;
  }

  /* ===================== DATE FORMAT ===================== */

  const formatDate = (date?: string | null) => {
    if (!date) return "-";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "-";

    return parsed
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replaceAll(" ", "-");
  };

  /* ===================== RETURN ===================== */

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-5">
      <div className="mx-auto max-w-7xl space-y-6 rounded-xl bg-white p-5 shadow-sm md:p-6">

        {/* ===================== HEADER ===================== */}

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="break-all text-lg font-semibold text-gray-900 md:text-xl">
              Order – {order.domainName}
            </h1>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex shrink-0 items-center gap-2 rounded bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
            >
              <FaArrowLeft />
              Back
            </button>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={openStatusModal}
              className="flex items-center gap-2 rounded bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 md:text-sm"
            >
              <FaRedo />
              Status
            </button>

            <button
              type="button"
              onClick={openLabelModal}
              className="flex items-center gap-2 rounded bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 md:text-sm"
            >
              <FaRedo />
              Label
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(`/admin/orders/update/${order._id}`)
              }
              className="flex items-center gap-2 rounded bg-yellow-500 px-3 py-2 text-xs font-medium text-white hover:bg-yellow-600 md:text-sm"
            >
              <FaEdit />
              Edit
            </button>

            <button
              type="button"
              onClick={openRenewModal}
              className="flex items-center gap-2 rounded bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 md:text-sm"
            >
              <FaRedo />
              Renew
            </button>
          </div>
        </div>

        {/* ===================== RENEWAL SUCCESS ===================== */}

        {renewSuccess && (
          <div className="rounded-lg bg-green-100 p-3 text-green-800">
            {renewSuccess}

            <button
              type="button"
              className="ml-3 underline"
              onClick={() => setRenewSuccess("")}
            >
              Dismiss
            </button>
          </div>
        )}
        {labelSuccess && (
  <div
    role="alert"
    className="rounded-lg border border-green-300 bg-green-100 p-3 text-sm font-medium text-green-800"
  >
    {labelSuccess}
    <button
      type="button"
      onClick={() => setLabelSuccess("")}
      className="ml-3 font-semibold text-green-800 underline"
    >
      Dismiss
    </button>
  </div>
)}

        {/* ===================== DOMAIN INFORMATION ===================== */}

        <Section title="Domain Information">
          <Info label="Domain Name" value={order.domainName} />
          <Info label="Managed By" value={order.managedBy} />

          <div className="min-w-0">
            <p className="mb-1 text-xs text-gray-500">Registrar</p>

            <div className="flex items-center gap-2">
              {order.domainSource?.image && (
                <img
                  src={
                    order.domainSource.image.startsWith("/")
                      ? `${API_BASE_URL}${order.domainSource.image}`
                      : `${API_BASE_URL}/${order.domainSource.image}`
                  }
                  className="h-6 w-6 object-contain"
                  alt={order.domainSource.name}
                />
              )}

              <span className="text-sm font-medium text-gray-900">
                {order.domainSource?.name || "-"}
              </span>
            </div>
          </div>

          <Info
            label="Registration Date"
            value={formatDate(order.registrationDate)}
          />

          <Info
            label="Expiry Date"
            value={formatDate(order.expiryDate)}
          />

          <Info label="Lock Status" value={order.lockStatus} />
          <Info label="Name Servers" value={order.nameServers} />

          <Info
            label="Order Labels"
            value={getLabelNames(
              order.labels ?? order.label,
              orderLabels
            )}
          />
        </Section>

        {/* ===================== CLIENT DETAILS ===================== */}

        {order.client && (
          <Section title="Client Details">
            <Info label="Name" value={order.client.name} />
            <Info label="Company" value={order.client.company} />
            <Info label="Email" value={order.client.email} />
            <Info label="Phone" value={order.client.phone} />
            <Info label="Address" value={order.client.address} />
            <Info label="City" value={order.client.city} />
            <Info label="State" value={order.client.state} />
            <Info label="Country" value={order.client.country} />
          </Section>
        )}

        {/* ===================== PLANS & SERVICES ===================== */}

        {order.plans && order.plans.length > 0 && (
          <Section title="Plans & Services" fullWidth>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse border border-gray-200 text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-200 px-2 py-3">
                      Email Type
                    </th>

                    <th className="border border-gray-200 px-2 py-3">
                      Plan Name
                    </th>

                    <th className="border border-gray-200 px-2 py-3">
                      Type
                    </th>

                    <th className="border border-gray-200 px-2 py-3">
                      Users
                    </th>

                    <th className="border border-gray-200 px-2 py-3">
                      Admin Email
                    </th>

                    <th className="border border-gray-200 px-2 py-3">
                      Admin Password
                    </th>

                    <th className="border border-gray-200 px-2 py-3">
                      Reg Date
                    </th>

                    <th className="border border-gray-200 px-2 py-3">
                      Exp Date
                    </th>

                    <th className="border border-gray-200 px-2 py-3">
                      Status
                    </th>

                    <th className="border border-gray-200 px-2 py-3">
                      Labels
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {order.plans.map((plan) => (
                    <tr key={plan._id}>
                      <td className="border border-gray-200 px-2 py-2">
                        {plan.emailType || "-"}
                      </td>

                      <td className="border border-gray-200 px-2 py-2">
                        {plan.planName}
                      </td>

                      <td className="border border-gray-200 px-2 py-2">
                        {plan.type}
                      </td>

                      <td className="border border-gray-200 px-2 py-2">
                        <div className="flex items-center justify-center gap-2">
                          <span>{plan.noOfUsers ?? 0}</span>

                          {plan.noOfUsers !== undefined &&
                            plan.noOfUsers !== null && (
                              <button
                                type="button"
                                title="Manage licences"
                                aria-label="Manage licences"
                                onClick={() => openLicenseModal(plan)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <FaEdit size={14} />
                              </button>
                            )}
                        </div>
                      </td>

                      <td className="border border-gray-200 px-2 py-2">
                        <div className="flex items-center gap-2">
                          <span className="break-all">
                            {plan.adminEmail || "-"}
                          </span>

                          {plan.adminEmail && (
                            <span className="relative inline-flex shrink-0">
                              <button
                                type="button"
                                title="Copy Admin Email"
                                aria-label="Copy Admin Email"
                                onClick={() =>
                                  copyToClipboard(
                                    plan.adminEmail!,
                                    "Admin Email",
                                    plan._id
                                  )
                                }
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <FaCopy />
                              </button>

                              {copyFeedback?.key ===
                                `${plan._id}-Admin Email` && (
                                  <span
                                    role="status"
                                    className={`absolute bottom-full left-full z-50 mb-1 ml-1 whitespace-nowrap rounded px-2 py-1 text-xs font-medium shadow-md ${copyFeedback.success
                                        ? "bg-green-600 text-white"
                                        : "bg-red-600 text-white"
                                      }`}
                                  >
                                    {copyFeedback.message}
                                  </span>
                                )}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="border border-gray-200 px-2 py-2">
                        <div className="flex items-center gap-2">
                          <span>
                            {plan.adminPassword ? "••••••••" : "-"}
                          </span>

                          {plan.adminPassword && (
                            <span className="relative inline-flex shrink-0">
                              <button
                                type="button"
                                title="Copy Admin Password"
                                aria-label="Copy Admin Password"
                                onClick={() =>
                                  copyToClipboard(
                                    plan.adminPassword!,
                                    "Admin Password",
                                    plan._id
                                  )
                                }
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <FaCopy />
                              </button>

                              {copyFeedback?.key ===
                                `${plan._id}-Admin Password` && (
                                  <span
                                    role="status"
                                    className={`absolute bottom-full left-full z-50 mb-1 ml-1 whitespace-nowrap rounded px-2 py-1 text-xs font-medium shadow-md ${copyFeedback.success
                                        ? "bg-green-600 text-white"
                                        : "bg-red-600 text-white"
                                      }`}
                                  >
                                    {copyFeedback.message}
                                  </span>
                                )}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="border border-gray-200 px-2 py-2">
                        {formatDate(plan.registrationDate)}
                      </td>

                      <td className="border border-gray-200 px-2 py-2">
                        {formatDate(plan.expiryDate)}
                      </td>

                      <td className="border border-gray-200 px-2 py-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-gray-700">
                            Primary: {plan.primary_status?.name || "-"}
                          </span>
                        </div>
                      </td>

                      {/* PLAN LABEL BUTTON ONLY */}

                      <td className="border border-gray-200 px-2 py-2">
                        <div className="flex min-w-[150px] flex-col items-start gap-2">
                          <button
                            type="button"
                            onClick={() => openPlanLabelModal(plan)}
                            className="rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                          >
                            Manage Labels
                          </button>

                          <div className="flex flex-wrap gap-1">
                            {getLabelNames(
                              plan.labels ?? plan.label,
                              planLabels
                            ) !== "-" ? (
                              getLabelNames(
                                plan.labels ?? plan.label,
                                planLabels
                              )
                                .split(", ")
                                .map((name, index) => (
                                 <span
  key={`${plan._id}-${index}`}
  className={`rounded-full px-2 py-1 text-[10px] font-medium ${
    getLabelColor(name)
  }`}
>
  {name}
</span>
                                ))
                            ) : (
                              <span className="text-[11px] text-gray-400">
                                No labels assigned
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* ===================== ORDER LABEL MODAL ===================== */}

        {labelModalOpen && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Update Order Labels
                </h2>

                <button
                  type="button"
                  onClick={() => setLabelModalOpen(false)}
                  disabled={labelUpdating}
                  className="text-gray-500 hover:text-gray-800"
                >
                  <FaTimes />
                </button>
              </div>

              <p className="mb-3 text-sm text-gray-600">
                Select one or more labels for this order.
              </p>

              <div className="max-h-64 space-y-3 overflow-y-auto rounded-lg border border-gray-200 p-3">
                {labelLoading ? (
                  <p className="text-sm text-gray-500">
                    Loading labels...
                  </p>
                ) : orderLabels.length === 0 ? (
                  <p className="text-sm text-orange-600">
                    No active order labels available.
                  </p>
                ) : (
                  orderLabels.map((label) => (
                    <label
                      key={label._id}
                      className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedOrderLabels.includes(label._id)}
                        onChange={(event) => {
                          handleOrderLabelSelection(
                            label._id,
                            event.target.checked
                          );
                          setOrderLabelChanged(true);
                        }}
                        disabled={labelUpdating || labelLoading}
                        className="h-4 w-4 rounded border-gray-300"
                      />

                      <span className="text-sm font-medium text-gray-700">
                        {label.statusLabelName}
                      </span>
                    </label>
                  ))
                )}
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Selected labels: {selectedOrderLabels.length}
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setLabelModalOpen(false)}
                  disabled={labelUpdating}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>

             <button
  type="button"
  onClick={handleOrderLabelUpdate}
 disabled={
  labelUpdating ||
  labelLoading ||
  selectedOrderLabels.length === 0
}
  className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
>
  {labelUpdating ? "Saving..." : "Save Labels"}
</button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== PLAN LABEL MODAL ===================== */}

        {planLabelModalOpen && activePlanLabelId && (
          <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Update Plan Labels
                </h2>

                <button
                  type="button"
                  onClick={() => {
                    setPlanLabelModalOpen(false);
                    setActivePlanLabelId(null);
                  }}
                  disabled={savingPlanLabel === activePlanLabelId}
                  className="text-gray-500 hover:text-gray-800"
                >
                  <FaTimes />
                </button>
              </div>

              <p className="mb-3 text-sm text-gray-600">
                Select one or more labels for this plan.
              </p>

              <div className="max-h-64 space-y-3 overflow-y-auto rounded-lg border border-gray-200 p-3">
                {labelLoading ? (
                  <p className="text-sm text-gray-500">
                    Loading labels...
                  </p>
                ) : planLabels.length === 0 ? (
                  <p className="text-sm text-orange-600">
                    No active plan labels available.
                  </p>
                ) : (
                  planLabels.map((label) => (
                    <label
                      key={label._id}
                      className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={(
                          planLabelSelections[activePlanLabelId] || []
                        ).includes(label._id)}
                        onChange={(event) =>
                          handlePlanLabelSelection(
                            activePlanLabelId,
                            label._id,
                            event.target.checked
                          )
                        }
                        disabled={savingPlanLabel === activePlanLabelId}
                        className="h-4 w-4 rounded border-gray-300"
                      />

                      <span className="text-sm font-medium text-gray-700">
                        {label.statusLabelName}
                      </span>
                    </label>
                  ))
                )}
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Selected labels:{" "}
                {(planLabelSelections[activePlanLabelId] || []).length}
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPlanLabelModalOpen(false);
                    setActivePlanLabelId(null);
                  }}
                  disabled={savingPlanLabel === activePlanLabelId}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSavePlanLabels}
                  disabled={
  savingPlanLabel === activePlanLabelId ||
  labelLoading ||
  (planLabelSelections[activePlanLabelId] || []).length === 0
}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {savingPlanLabel === activePlanLabelId
                    ? "Saving..."
                    : "Save Labels"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== RENEWAL POPUP ===================== */}

        {renewOrder && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {renewStep === "dates"
                    ? "Select Renewal Items"
                    : "Confirm Renewal"}
                </h2>

                <button
                  type="button"
                  onClick={closeRenewModal}
                  disabled={renewUpdating}
                  className="text-2xl text-gray-500"
                >
                  ×
                </button>
              </div>

              <p className="mb-4 text-sm text-gray-600">
                Domain: <strong>{renewOrder.domainName}</strong>
              </p>

              {renewError && (
                <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-800">
                  {renewError}
                </p>
              )}

              {renewStep === "dates" ? (
                <>
                  <p className="mb-4 text-sm text-gray-600">
                    Select the domain or plans you want to renew.
                    Yearly is the default for plans unless monthly
                    renewal is already configured.
                  </p>

                  <div className="space-y-4">
                    {itemsWithSelectedDuration.map((item) => {
                      const checked = selectedItems.includes(item.key);
                      const duration = item.durationMonths;

                      return (
                        <div
                          key={item.key}
                          className="rounded-lg border p-4"
                        >
                          <label className="flex items-center gap-3 font-medium">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(event) =>
                                toggleRenewalItem(
                                  item.key,
                                  event.target.checked
                                )
                              }
                            />

                            {item.label}

                            <span className="text-xs text-gray-500">
                              ({duration} month
                              {duration === 1 ? "" : "s"})
                            </span>
                          </label>

                          {item.target === "plan" && (
                            <div className="mt-4">
                              <p className="mb-2 text-sm font-medium text-gray-700">
                                Renewal Type
                              </p>

                              <div className="flex flex-wrap gap-5">
                                <label
                                  className={`flex items-center gap-2 ${item.monthlyLocked
                                      ? "cursor-not-allowed text-gray-400"
                                      : "cursor-pointer"
                                    }`}
                                >
                                  <input
                                    type="radio"
                                    name={`duration-${item.key}`}
                                    value="12"
                                    checked={duration === 12}
                                    disabled={
                                      item.monthlyLocked || !checked
                                    }
                                    onChange={() =>
                                      handleDurationChange(item, 12)
                                    }
                                  />

                                  Yearly (12 months)
                                </label>

                                <label
                                  className={`flex items-center gap-2 ${!item.monthlyLocked && checked
                                      ? "cursor-pointer"
                                      : "cursor-not-allowed text-gray-400"
                                    }`}
                                >
                                  <input
                                    type="radio"
                                    name={`duration-${item.key}`}
                                    value="1"
                                    checked={duration === 1}
                                    disabled={
                                      item.monthlyLocked || !checked
                                    }
                                    onChange={() =>
                                      handleDurationChange(item, 1)
                                    }
                                  />

                                  Monthly (1 month)
                                </label>
                              </div>

                              {item.monthlyLocked && (
                                <p className="mt-2 text-xs text-orange-600">
                                  This plan is configured for monthly
                                  renewal. The renewal type cannot be changed.
                                </p>
                              )}
                            </div>
                          )}

                          {item.target === "domain" && (
                            <p className="mt-2 text-xs text-gray-500">
                              Domain renewal: Yearly (12 months)
                            </p>
                          )}

                          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <p className="text-sm text-gray-500">
                                Current expiry
                              </p>

                              <p>
                                {displayDate(item.currentExpiry)}
                              </p>
                            </div>

                            <div>
                              <label className="mb-1 block text-sm">
                                New expiry date
                              </label>

                              <input
                                type="date"
                                disabled={!checked}
                                min={toDateInputValue(new Date())}
                                value={renewDates[item.key] || ""}
                                onChange={(event) =>
                                  changeRenewalDate(
                                    item.key,
                                    event.target.value
                                  )
                                }
                                className="w-full rounded-lg border p-2 disabled:bg-gray-100"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeRenewModal}
                      className="rounded-lg border px-4 py-2"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={
                        !selectedRenewalItems.length ||
                        selectedRenewalItems.some(
                          (item) => !renewDates[item.key]
                        )
                      }
                      onClick={handleContinueRenewal}
                      className="rounded-lg bg-green-600 px-4 py-2 text-white disabled:opacity-50"
                    >
                      Continue
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="mb-4 text-sm text-gray-600">
                    Check the selected services, renewal types and expiry
                    dates before saving.
                  </p>

                  <div className="space-y-3 rounded-lg border p-4">
                    {selectedRenewalItems.map((item) => (
                      <div
                        key={item.key}
                        className="flex justify-between gap-4 border-b pb-3 last:border-0"
                      >
                        <div>
                          <p className="font-medium">
                            {item.label}
                          </p>

                          <p className="text-sm text-gray-500">
                            Old: {displayDate(item.currentExpiry)}
                          </p>

                          <p className="text-sm text-gray-500">
                            Renewal type:{" "}
                            {item.target === "domain"
                              ? "Yearly"
                              : item.durationMonths === 1
                                ? "Monthly"
                                : "Yearly"}
                          </p>

                          <p className="text-xs text-gray-500">
                            Duration: {item.durationMonths} month
                            {item.durationMonths === 1 ? "" : "s"}
                          </p>
                        </div>

                        <p className="font-semibold text-green-700">
                          {displayDate(renewDates[item.key])}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      disabled={renewUpdating}
                      onClick={() => {
                        setRenewError("");
                        setRenewStep("dates");
                      }}
                      className="rounded-lg border px-4 py-2"
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      disabled={renewUpdating}
                      onClick={handleConfirmRenewal}
                      className="rounded-lg bg-green-600 px-4 py-2 text-white disabled:opacity-50"
                    >
                      {renewUpdating
                        ? "Saving..."
                        : "Confirm Renewal"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ===================== MANAGE LICENCES MODAL ===================== */}

        {licenseModalOpen && selectedLicensePlan && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <FaUsers size={17} />
                    </div>

                    <h2 className="text-lg font-semibold text-gray-900">
                      Manage Licences
                    </h2>
                  </div>

                  <p className="mt-2 text-sm text-gray-500">
                    {selectedLicensePlan.planName ||
                      selectedLicensePlan.emailType ||
                      selectedLicensePlan.type ||
                      "Subscription"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setLicenseModalOpen(false)}
                  aria-label="Close"
                  className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <FaTimes size={17} />
                </button>
              </div>

              <div className="space-y-6 px-6 py-6">
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Current Licences
                  </p>

                  <p className="mt-1 text-3xl font-bold text-gray-900">
                    {currentLicenseCount}
                  </p>
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold text-gray-800">
                    Update Licence Total
                  </p>

                  <div className="flex items-center justify-center gap-5">
                    <button
                      type="button"
                      onClick={() => changeLicenseTotal(-1)}
                      disabled={
                        !Number.isInteger(newLicenseTotal) ||
                        newLicenseTotal <= 1
                      }
                      aria-label="Decrease licences"
                      className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-700 shadow-sm hover:border-red-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <FaMinus size={16} />
                    </button>

                    <div className="min-w-[100px] text-center">
                      <input
                        type="number"
                        min={1}
                        max={300}
                        step={1}
                        value={newLicenseTotalInput}
                        onChange={(event) =>
                          setNewLicenseTotalInput(event.target.value)
                        }
                        className="w-full border-0 bg-transparent text-center text-4xl font-bold text-gray-900 outline-none"
                      />

                      <p className="mt-1 text-xs text-gray-500">
                        Total Licences
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => changeLicenseTotal(1)}
                      disabled={
                        !Number.isInteger(newLicenseTotal) ||
                        newLicenseTotal >= 300
                      }
                      aria-label="Increase licences"
                      className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-700 shadow-sm hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <FaPlus size={16} />
                    </button>
                  </div>

                  <p className="mt-3 text-center text-xs text-gray-500">
                    Minimum: 1 licence | Maximum: 300 licences
                  </p>

                  {newLicenseTotalInput.trim() !== "" &&
                    (!Number.isInteger(newLicenseTotal) ||
                      newLicenseTotal < 1 ||
                      newLicenseTotal > 300) && (
                      <p className="mt-2 text-center text-xs font-medium text-red-600">
                        Please enter a whole number between 1 and 300.
                      </p>
                    )}
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="mb-3 text-sm font-semibold text-gray-800">
                    Licence Summary
                  </p>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Current Total</span>
                      <span className="font-semibold text-gray-900">
                        {currentLicenseCount}
                      </span>
                    </div>

                    <div className="flex justify-between text-gray-600">
                      <span>Change</span>

                      <span
                        className={`font-semibold ${licenseDelta > 0
                            ? "text-green-600"
                            : licenseDelta < 0
                              ? "text-red-600"
                              : "text-gray-500"
                          }`}
                      >
                        {licenseDelta > 0
                          ? `+${licenseDelta}`
                          : licenseDelta < 0
                            ? `${licenseDelta}`
                            : "No change"}
                      </span>
                    </div>

                    <div className="flex justify-between border-t border-gray-100 pt-3 font-semibold text-gray-900">
                      <span>New Total</span>

                      <span className="text-xl">
                        {Number.isInteger(newLicenseTotal) &&
                          newLicenseTotal >= 1 &&
                          newLicenseTotal <= 300
                          ? newLicenseTotal
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50/70 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setLicenseModalOpen(false)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleContinueLicenses}
                  disabled={!isLicenseTotalValid}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== CONFIRM LICENCE UPDATE MODAL ===================== */}

        {licenseConfirmModalOpen && selectedLicensePlan && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <FaUsers size={20} />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Confirm Licence Update
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Review the licence changes before confirming.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setLicenseConfirmModalOpen(false);
                    setLicenseModalOpen(true);
                  }}
                  aria-label="Close"
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <FaTimes size={17} />
                </button>
              </div>

              <div className="space-y-5 px-6 py-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Subscription Plan
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {selectedLicensePlan.planName ||
                      selectedLicensePlan.emailType ||
                      selectedLicensePlan.type ||
                      "Subscription"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-4 text-sm font-semibold text-slate-800">
                    Licence Summary
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs text-slate-500">
                        Current Licences
                      </p>

                      <p className="mt-1 text-2xl font-semibold text-slate-900">
                        {currentLicenseCount}
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs text-slate-500">
                        Licence Change
                      </p>

                      <p
                        className={`mt-1 text-2xl font-semibold ${licenseDelta > 0
                            ? "text-green-600"
                            : "text-red-600"
                          }`}
                      >
                        {licenseDelta > 0
                          ? `+${licenseDelta}`
                          : licenseDelta}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-lg bg-white px-3 py-3">
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        New Total Licences
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        After this update
                      </p>
                    </div>

                    <p className="text-3xl font-bold text-slate-900">
                      {newLicenseTotal}
                    </p>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="license-po-number"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    P.O. #
                    <span className="ml-1 font-normal text-slate-400">
                      (optional)
                    </span>
                  </label>

                  <input
                    id="license-po-number"
                    type="text"
                    value={purchaseOrderNumber}
                    onChange={(event) =>
                      setPurchaseOrderNumber(event.target.value)
                    }
                    placeholder="Enter purchase order number"
                    maxLength={100}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div className="rounded-lg bg-blue-50 px-3.5 py-3 text-blue-800">
                  <p className="text-xs leading-5">
                    Please verify the new licence count before confirming.
                    This will update the subscription quantity.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
                <button
                  type="button"
                  onClick={() => {
                    setLicenseConfirmModalOpen(false);
                    setLicenseModalOpen(true);
                  }}
                  disabled={licenseUpdating}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleConfirmLicenses}
                  disabled={licenseUpdating || !isLicenseTotalValid}
                  className="inline-flex min-w-[130px] items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {licenseUpdating ? "Updating..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== STATUS UPDATE MODAL ===================== */}

        {statusModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Update Status
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Select the status you want to update.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  disabled={statusUpdating}
                  className="text-gray-500 hover:text-gray-800"
                >
                  <FaTimes size={18} />
                </button>
              </div>

              <div className="space-y-4 p-5">

                {/* ORDER STATUS */}

                <div className="rounded-lg border p-4">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={updateOrderStatusChecked}
                      onChange={(event) =>
                        setUpdateOrderStatusChecked(event.target.checked)
                      }
                      className="h-4 w-4"
                    />

                    <span className="font-medium text-gray-800">
                      Order Status
                    </span>
                  </label>

                  {updateOrderStatusChecked && (
                    <div className="ml-7 mt-3">
                      <select
                        value={selectedOrderStatus}
                        onChange={(event) =>
                          setSelectedOrderStatus(event.target.value)
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs font-medium md:text-sm"
                      >
                        <option value="">Select Order Status</option>

                        {statuses
                          .filter(
                            (status) =>
                              status.is_active ||
                              status._id === order.order_status?._id
                          )
                          .map((status) => (
                            <option key={status._id} value={status._id}>
                              {status.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* DOMAIN STATUS */}

                {order.domainSource && (
                  <div className="rounded-lg border p-4">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={updateDomainStatusChecked}
                        onChange={(event) =>
                          setUpdateDomainStatusChecked(event.target.checked)
                        }
                        className="h-4 w-4"
                      />

                      <span className="font-medium text-gray-800">
                        Domain Status
                      </span>
                    </label>

                    {updateDomainStatusChecked && (
                      <div className="ml-7 mt-3">
                        <select
                          value={selectedDomainStatus}
                          onChange={(event) =>
                            setSelectedDomainStatus(event.target.value)
                          }
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs font-medium md:text-sm"
                        >
                          <option value="">Select Domain Status</option>

                          {domainStatuses
                            .filter(
                              (status) =>
                                status.is_active ||
                                status._id === order.domain_status?._id
                            )
                            .map((status) => (
                              <option key={status._id} value={status._id}>
                                {status.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* PLAN STATUS */}

                {(order.plans || []).length > 0 && (
                  <div className="rounded-lg border p-4">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={updatePlanStatusChecked}
                        onChange={(event) =>
                          setUpdatePlanStatusChecked(event.target.checked)
                        }
                        className="h-4 w-4"
                      />

                      <span className="font-medium text-gray-800">
                        Plan Status
                      </span>
                    </label>

                    {updatePlanStatusChecked && (
                      <div className="ml-7 mt-4 space-y-4">
                        {(order.plans || []).map((plan) => (
                          <div
                            key={plan._id}
                            className="rounded-lg border bg-gray-50 p-3"
                          >
                            <p className="mb-3 font-medium text-gray-800">
                              {plan.emailType || plan.planName || "-"}
                            </p>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                  Primary Status
                                </label>

                                <select
                                  value={
                                    selectedPrimaryPlanStatuses[plan._id] || ""
                                  }
                                  onChange={(event) =>
                                    setSelectedPrimaryPlanStatuses(
                                      (previous) => ({
                                        ...previous,
                                        [plan._id]: event.target.value,
                                      })
                                    )
                                  }
                                  className="w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm"
                                >
                                  <option value="">
                                    Select Primary Status
                                  </option>

                                  {plan.primary_status &&
                                    !(
                                      primaryPlanStatuses[plan._id] || []
                                    ).some(
                                      (status) =>
                                        status._id === plan.primary_status?._id
                                    ) && (
                                      <option
                                        value={plan.primary_status._id}
                                      >
                                        {plan.primary_status.name}
                                      </option>
                                    )}

                                  {(primaryPlanStatuses[plan._id] || [])
                                    .filter(
                                      (status) =>
                                        status.is_active ||
                                        status._id ===
                                        plan.primary_status?._id
                                    )
                                    .map((status) => (
                                      <option
                                        key={status._id}
                                        value={status._id}
                                      >
                                        {status.name}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* MODAL ACTIONS */}

                <div className="flex justify-end gap-3 border-t pt-3">
                  <button
                    type="button"
                    onClick={() => setStatusModalOpen(false)}
                    disabled={statusUpdating}
                    className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleStatusUpdate}
                    disabled={statusUpdating}
                    className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {statusUpdating ? "Updating..." : "Update Status"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;