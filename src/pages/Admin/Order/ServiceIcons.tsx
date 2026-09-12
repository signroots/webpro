import {
  FaEnvelope,
  FaServer,
  FaLock,
  FaLaptopCode,
  FaGlobe,
} from "react-icons/fa";

import { useState } from "react";

import { useAuth } from "../../../Common/AuthContext/Auth";

export default function ServiceIcons({
  order,
  fetchOrderById,
}: any) {
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL;

  const [selectedOrderId, setSelectedOrderId] =
    useState<string | null>(null);

  const [isHovering, setIsHovering] =
    useState(false);

  const [msofficeCache, setMsofficeCache] =
    useState<any>({});

  const formatDate = (date: any) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString();
  };

  const { user } = useAuth();

  const loggedInUserType =
    user?.type?.toLowerCase() ||
    user?.role?.toLowerCase() ||
    "";

  const isClientOrCustomer =
    loggedInUserType === "client" ||
    loggedInUserType === "customer";

  // ========================================================
  // DOMAIN STATUS
  // ========================================================

  const domainStatus =
    String(
      order?.domain_status?.code ||
        order?.domain_status?.name ||
        ""
    )
      .trim()
      .toUpperCase();

  const isDomainDisabled =
    domainStatus === "TRANSFERRED" ||
    domainStatus === "CANCELLED";

  // ========================================================
  // PLAN STATUS
  // ========================================================

  const isPlanDisabled = (plan: any) => {
    const primaryStatus =
      String(
        plan?.primary_status?.code ||
          plan?.primary_status?.name ||
          ""
      )
        .trim()
        .toUpperCase();

    return (
      primaryStatus === "TRANSFERRED" ||
      primaryStatus === "CANCELLED"
    );
  };

  // ========================================================
  // MS OFFICE HOVER
  // ========================================================

  const handleMsofficeHover = async () => {
    setSelectedOrderId(order._id);
    setIsHovering(true);

    if (msofficeCache[order._id]) return;

    try {
      const fullOrder =
        await fetchOrderById(order._id);

      const plans =
        fullOrder?.data?.plans || [];

      const msofficePlans =
        plans.filter(
          (p: any) =>
            p?.serviceType
              ?.toLowerCase() === "msoffice" ||
            p?.type
              ?.toLowerCase() === "msoffice"
        );

      setMsofficeCache(
        (prev: any) => ({
          ...prev,
          [order._id]:
            msofficePlans,
        })
      );
    } catch (err) {
      console.error(
        "MS Office fetch error",
        err
      );
    }
  };

  return (
    <div className="flex items-center justify-center gap-3 whitespace-nowrap">

      {/* ================================================== */}
      {/* DOMAIN SOURCE */}
      {/* ================================================== */}

      <div
        className={
          isDomainDisabled
            ? "opacity-40 grayscale pointer-events-none"
            : ""
        }
        title={
          isDomainDisabled
            ? `Domain ${domainStatus}`
            : undefined
        }
      >
        {isClientOrCustomer ? (
          // ================================================
          // CLIENT / CUSTOMER USER
          // ================================================
          String(order.managedBy || "")
            .trim()
            .toLowerCase() === "signroots" ? (
            // SignRoots → BLUE
            <FaGlobe
              className={`w-6 h-6 ${
                isDomainDisabled
                  ? "text-gray-400"
                  : "text-blue-500"
              }`}
              title={
                isDomainDisabled
                  ? `Domain ${domainStatus}`
                  : "Managed by SignRoots"
              }
            />
          ) : String(
              order.managedBy || ""
            )
              .trim()
              .toLowerCase() ===
            "customer" ? (
            // Customer managed
            order.domainSource?.image ? (
              <img
                src={
                  order.domainSource.image.startsWith(
                    "/"
                  )
                    ? `${API_BASE_URL}${order.domainSource.image}`
                    : `${API_BASE_URL}/uploads/domainsources/${order.domainSource.image}`
                }
                className={`w-6 h-6 object-contain ${
                  isDomainDisabled
                    ? "grayscale opacity-40"
                    : ""
                }`}
                title={
                  isDomainDisabled
                    ? `Domain ${domainStatus}`
                    : order.domainSource.name ||
                      "Domain Source"
                }
              />
            ) : (
              <FaGlobe
                className={`w-6 h-6 ${
                  isDomainDisabled
                    ? "text-gray-400"
                    : "text-gray-400"
                }`}
                title="No Domain Source"
              />
            )
          ) : (
            // Unknown managedBy
            <FaGlobe
              className="w-6 h-6 text-gray-400"
              title="No Domain Source"
            />
          )
        ) : (
          // ================================================
          // ADMIN USER
          // ================================================
          order.domainSource?.image ? (
            <img
              src={
                order.domainSource.image.startsWith(
                  "/"
                )
                  ? `${API_BASE_URL}${order.domainSource.image}`
                  : `${API_BASE_URL}/uploads/domainsources/${order.domainSource.image}`
              }
              className={`w-6 h-6 object-contain ${
                isDomainDisabled
                  ? "grayscale opacity-40"
                  : ""
              }`}
              title={
                isDomainDisabled
                  ? `Domain ${domainStatus}`
                  : order.domainSource.name ||
                    "Domain Source"
              }
            />
          ) : (
            <FaGlobe
              className={`w-6 h-6 ${
                isDomainDisabled
                  ? "text-gray-400"
                  : "text-gray-400"
              }`}
              title="No Domain Source"
            />
          )
        )}
      </div>

      {/* ================================================== */}
      {/* EMAIL */}
      {/* ================================================== */}

      {
        order.Plans?.some(
          (plan: any) =>
            plan.type
              ?.toLowerCase() === "email"
        ) ? (
          order.Plans
            .filter(
              (plan: any) =>
                plan.type
                  ?.toLowerCase() ===
                "email"
            )
            .map(
              (
                plan: any,
                index: number
              ) => {
                const disabled =
                  isPlanDisabled(plan);

                return (
                  <div
                    key={index}
                    className={`relative group ${
                      disabled
                        ? "opacity-40 grayscale pointer-events-none"
                        : ""
                    }`}
                    title={
                      disabled
                        ? `Email ${String(
                            plan
                              ?.primary_status
                              ?.name ||
                              plan
                                ?.primary_status
                                ?.code ||
                              ""
                          ).toUpperCase()}`
                        : plan.emailType
                    }
                  >
                    {/* Email Image + User Badge */}
                    <div className="relative inline-block">

                      <img
                        src={
                          plan.emailTypeImage
                            ? `${API_BASE_URL}${plan.emailTypeImage}`
                            : "/email.png"
                        }
                        className="w-6 h-6 cursor-pointer"
                        title={
                          disabled
                            ? `Email ${String(
                                plan
                                  ?.primary_status
                                  ?.name ||
                                  plan
                                    ?.primary_status
                                    ?.code ||
                                  ""
                              ).toUpperCase()}`
                            : plan.emailType
                        }
                      />

                      {/* User Badge */}
                      <span
                        className="
                          absolute
                          -top-2
                          -right-2
                          min-w-[16px]
                          h-4
                          px-1
                          flex
                          items-center
                          justify-center
                          rounded-full
                          bg-red-500
                          text-white
                          text-[10px]
                          font-[300]
                          border
                          border-white
                        "
                      >
                        {plan.noOfUsers ?? 0}
                      </span>

                    </div>
                  </div>
                );
              }
            )
        ) : (
          <FaEnvelope
            className="w-6 h-6 text-gray-300"
            title="No Email"
          />
        )
      }

      {/* ================================================== */}
      {/* HOSTING */}
      {/* ================================================== */}

      {(() => {
        const hostingPlans =
          order.Plans?.filter(
            (plan: any) =>
              plan.type?.toLowerCase() ===
              "hosting"
          ) || [];

        if (hostingPlans.length === 0) {
          return (
            <FaServer
              className="w-6 h-6 text-gray-300"
              title="Hosting"
            />
          );
        }

        return hostingPlans.map(
          (
            plan: any,
            index: number
          ) => {
            const disabled =
              isPlanDisabled(plan);

            return (
              <FaServer
                key={index}
                className={`w-6 h-6 ${
                  disabled
                    ? "text-gray-400 opacity-40 grayscale"
                    : "text-purple-500"
                }`}
                title={
                  disabled
                    ? `Hosting ${String(
                        plan
                          ?.primary_status
                          ?.name ||
                          plan
                            ?.primary_status
                            ?.code ||
                          ""
                      ).toUpperCase()}`
                    : "Hosting"
                }
              />
            );
          }
        );
      })()}

      {/* ================================================== */}
      {/* WEBSITE */}
      {/* ================================================== */}

      {(() => {
        const websitePlans =
          order.Plans?.filter(
            (plan: any) =>
              plan.type?.toLowerCase() ===
              "website"
          ) || [];

        if (websitePlans.length === 0) {
          return (
            <FaLaptopCode
              className="w-6 h-6 text-gray-300"
              title="Website"
            />
          );
        }

        return websitePlans.map(
          (
            plan: any,
            index: number
          ) => {
            const disabled =
              isPlanDisabled(plan);

            return (
              <FaLaptopCode
                key={index}
                className={`w-6 h-6 ${
                  disabled
                    ? "text-gray-400 opacity-40 grayscale"
                    : "text-blue-500"
                }`}
                title={
                  disabled
                    ? `Website ${String(
                        plan
                          ?.primary_status
                          ?.name ||
                          plan
                            ?.primary_status
                            ?.code ||
                          ""
                      ).toUpperCase()}`
                    : "Website"
                }
              />
            );
          }
        );
      })()}

      {/* ================================================== */}
      {/* MS OFFICE */}
      {/* ================================================== */}

      {
        order.Plans
          ?.filter(
            (plan: any) =>
              plan.type
                ?.toLowerCase() ===
              "msoffice"
          )
          .map(
            (
              plan: any,
              index: number
            ) => {
              const disabled =
                isPlanDisabled(plan);

              return (
                <div
                  key={index}
                  className={`relative inline-block ${
                    disabled
                      ? "opacity-40 grayscale pointer-events-none"
                      : ""
                  }`}
                  onMouseEnter={
                    handleMsofficeHover
                  }
                  onMouseLeave={() =>
                    setIsHovering(false)
                  }
                  title={
                    disabled
                      ? `MS Office ${String(
                          plan
                            ?.primary_status
                            ?.name ||
                            plan
                              ?.primary_status
                              ?.code ||
                            ""
                        ).toUpperCase()}`
                      : plan.emailType
                  }
                >
                  {/* MS Office Icon */}
                  <img
                    src={
                      plan.emailTypeImage
                        ? `${API_BASE_URL}${plan.emailTypeImage}`
                        : "/MSOffice.png"
                    }
                    className="w-6 h-6 object-contain"
                    title={
                      disabled
                        ? `MS Office ${String(
                            plan
                              ?.primary_status
                              ?.name ||
                              plan
                                ?.primary_status
                                ?.code ||
                              ""
                          ).toUpperCase()}`
                        : plan.emailType
                    }
                  />

                  {/* No. of Users Badge */}
                  <span
                    className="
                      absolute
                      -top-2
                      -right-2
                      min-w-[16px]
                      h-4
                      px-1
                      flex
                      items-center
                      justify-center
                      rounded-full
                      bg-red-500
                      text-white
                      text-[10px]
                      font-[300]
                      border
                      border-white
                    "
                  >
                    {plan.noOfUsers ?? 0}
                  </span>
                </div>
              );
            }
          )
      }

      {/* ================================================== */}
      {/* SSL */}
      {/* ================================================== */}

      {
        order.Plans?.filter(
          (plan: any) =>
            plan.type
              ?.toLowerCase() === "ssl"
        ).map(
          (
            plan: any,
            index: number
          ) => {
            const disabled =
              isPlanDisabled(plan);

            return (
              <FaLock
                key={index}
                className={`w-6 h-6 ${
                  disabled
                    ? "text-gray-400 opacity-40 grayscale"
                    : "text-yellow-500"
                }`}
                title={
                  disabled
                    ? `SSL ${String(
                        plan
                          ?.primary_status
                          ?.name ||
                          plan
                            ?.primary_status
                            ?.code ||
                          ""
                      ).toUpperCase()}`
                    : "SSL"
                }
              />
            );
          }
        )
      }

    </div>
  );
}

