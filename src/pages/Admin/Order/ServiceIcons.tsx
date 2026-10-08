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
  isArchivedPage = false,
}: any) {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [selectedOrderId, setSelectedOrderId] =
    useState<string | null>(null);

  const [isHovering, setIsHovering] =
    useState(false);

  const [msofficeCache, setMsofficeCache] =
    useState<any>({});

  const { user } = useAuth();

  // =========================================================
  // USER TYPE
  // =========================================================

  const loggedInUserType =
    user?.type?.toLowerCase() ||
    user?.role?.toLowerCase() ||
    "";

  const isClientOrCustomer =
    loggedInUserType === "client" ||
    loggedInUserType === "customer";

  // =========================================================
  // STATUS HELPER
  // =========================================================

  const getStatusValue = (status: any): string => {
    if (!status) {
      return "";
    }

    if (typeof status === "string") {
      return status.trim().toUpperCase();
    }

    return String(
      status?.code ||
        status?.name ||
        ""
    )
      .trim()
      .toUpperCase();
  };

  // =========================================================
  // SPECIAL STATUSES
  // =========================================================

  const DISABLED_STATUSES = [
    "TRANSFERRED",
    "CANCELLED",
  ];

  // =========================================================
  // DOMAIN STATUS
  // =========================================================
  //
  // NORMAL ORDER PAGE:
  //
  // ACTIVE
  //   -> Enabled
  //
  // TRANSFERRED / CANCELLED
  //   -> Disabled
  //
  //
  // ARCHIVED ORDER PAGE:
  //
  // ACTIVE
  //   -> Disabled
  //
  // TRANSFERRED / CANCELLED
  //   -> Enabled
  //
  // =========================================================

  const domainStatus = getStatusValue(
    order?.domain_status
  );

  const isDomainDisabled = isArchivedPage
    ? !DISABLED_STATUSES.includes(domainStatus)
    : DISABLED_STATUSES.includes(domainStatus);

  // =========================================================
  // PLAN STATUS
  // =========================================================

  const getPlanPrimaryStatus = (
    plan: any
  ): string => {
    return getStatusValue(
      plan?.primary_status
    );
  };

  // =========================================================
  // PLAN DISABLED LOGIC
  // =========================================================
  //
  // NORMAL ORDER PAGE:
  //
  // ACTIVE
  //   -> Enabled
  //
  // TRANSFERRED / CANCELLED
  //   -> Disabled
  //
  //
  // ARCHIVED ORDER PAGE:
  //
  // ACTIVE
  //   -> Disabled
  //
  // TRANSFERRED / CANCELLED
  //   -> Enabled
  //
  // =========================================================

  const isPlanDisabled = (
    plan: any
  ): boolean => {
    const primaryStatus =
      getPlanPrimaryStatus(plan);

    if (isArchivedPage) {
      return !DISABLED_STATUSES.includes(
        primaryStatus
      );
    }

    return DISABLED_STATUSES.includes(
      primaryStatus
    );
  };

  // =========================================================
  // PLAN TITLE
  // =========================================================

  const getPlanStatusTitle = (
    plan: any,
    serviceName: string
  ): string => {
    const status =
      getPlanPrimaryStatus(plan);

    if (
      isPlanDisabled(plan)
    ) {
      return `${serviceName} ${status}`;
    }

    return serviceName;
  };

  // =========================================================
  // DOMAIN IMAGE URL
  // =========================================================

  const getDomainImageUrl = (): string | null => {
    const image =
      order?.domainSource?.image;

    if (!image) {
      return null;
    }

    if (image.startsWith("http")) {
      return image;
    }

    if (image.startsWith("/")) {
      return `${API_BASE_URL}${image}`;
    }

    return `${API_BASE_URL}/uploads/domainsources/${image}`;
  };

  // =========================================================
  // EMAIL IMAGE URL
  // =========================================================

  const getEmailImageUrl = (
    plan: any
  ): string => {
    const image =
      plan?.emailTypeImage;

    if (!image) {
      return "/email.png";
    }

    if (image.startsWith("http")) {
      return image;
    }

    if (image.startsWith("/")) {
      return `${API_BASE_URL}${image}`;
    }

    return `${API_BASE_URL}/${image}`;
  };

  // =========================================================
  // MS OFFICE HOVER
  // =========================================================

  const handleMsofficeHover = async () => {
    if (!order?._id) {
      return;
    }

    setSelectedOrderId(order._id);
    setIsHovering(true);

    if (msofficeCache[order._id]) {
      return;
    }

    try {
      const fullOrder =
        await fetchOrderById(
          order._id
        );

      const plans =
        fullOrder?.data?.plans || [];

      const msofficePlans =
        plans.filter(
          (p: any) =>
            p?.serviceType
              ?.toLowerCase() ===
              "msoffice" ||
            p?.type?.toLowerCase() ===
              "msoffice"
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

  // =========================================================
  // DOMAIN ICON
  // =========================================================

  const renderDomainIcon = () => {
    // =======================================================
    // DISABLED DOMAIN
    // =======================================================

    if (isDomainDisabled) {
      return (
        <FaGlobe
          className="w-6 h-6 text-gray-400"
          title={`Domain ${domainStatus}`}
        />
      );
    }

    // =======================================================
    // ENABLED DOMAIN
    // =======================================================

    const domainImage =
      getDomainImageUrl();

    // =======================================================
    // CLIENT / CUSTOMER
    // =======================================================

    if (isClientOrCustomer) {
      const managedBy =
        String(
          order?.managedBy || ""
        )
          .trim()
          .toLowerCase();

      if (managedBy === "signroots") {
        return (
          <FaGlobe
            className="w-6 h-6 text-blue-500"
            title="Managed by SignRoots"
          />
        );
      }

      if (
        managedBy === "customer" &&
        domainImage
      ) {
        return (
          <img
            src={domainImage}
            className="w-6 h-6 object-contain"
            title={
              order?.domainSource?.name ||
              "Domain Source"
            }
          />
        );
      }

      return (
        <FaGlobe
          className="w-6 h-6 text-gray-400"
          title="No Domain Source"
        />
      );
    }

    // =======================================================
    // ADMIN / OTHER USER
    // =======================================================

    if (domainImage) {
      return (
        <img
          src={domainImage}
          className="w-6 h-6 object-contain"
          title={
            order?.domainSource?.name ||
            "Domain Source"
          }
        />
      );
    }

    return (
      <FaGlobe
        className="w-6 h-6 text-gray-400"
        title="No Domain Source"
      />
    );
  };

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <div className="flex items-center justify-center gap-3 whitespace-nowrap">

      {/* =====================================================
          DOMAIN
      ===================================================== */}

      <div
        className={
          isDomainDisabled
            ? "opacity-40 grayscale pointer-events-none"
            : ""
        }
      >
        {renderDomainIcon()}
      </div>

      {/* =====================================================
          EMAIL
      ===================================================== */}

      {order?.Plans?.some(
        (plan: any) =>
          plan?.type?.toLowerCase() ===
          "email"
      ) ? (

        order.Plans
          .filter(
            (plan: any) =>
              plan?.type?.toLowerCase() ===
              "email"
          )
          .map(
            (
              plan: any,
              index: number
            ) => {

              const disabled =
                isPlanDisabled(plan);

              const planStatus =
                getPlanPrimaryStatus(
                  plan
                );

              return (
                <div
                  key={`email-${index}`}
                  className={`relative group ${
                    disabled
                      ? "opacity-40 grayscale pointer-events-none"
                      : ""
                  }`}
                  title={
                    disabled
                      ? getPlanStatusTitle(
                          plan,
                          "Email"
                        )
                      : plan?.emailType ||
                        "Email"
                  }
                >
                  <div className="relative inline-block">

                    {disabled ? (

                      <FaEnvelope
                        className="w-6 h-6 text-gray-400"
                        title={`Email ${planStatus}`}
                      />

                    ) : (

                      <img
                        src={getEmailImageUrl(
                          plan
                        )}
                        className="w-6 h-6 object-contain cursor-pointer"
                        title={
                          plan?.emailType ||
                          "Email"
                        }
                      />

                    )}

                  {!disabled && (
  <span className="absolute -top-2 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-[300] border border-white">
    {plan?.noOfUsers ?? 0}
  </span>
)}

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

      )}

      {/* =====================================================
          HOSTING
      ===================================================== */}

      {(() => {

        const hostingPlans =
          order?.Plans?.filter(
            (plan: any) =>
              plan?.type?.toLowerCase() ===
              "hosting"
          ) || [];

        if (
          hostingPlans.length === 0
        ) {
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

            const status =
              getPlanPrimaryStatus(
                plan
              );

            return (
              <FaServer
                key={`hosting-${index}`}
                className={`w-6 h-6 ${
                  disabled
                    ? "text-gray-400 opacity-40 grayscale"
                    : "text-purple-500"
                }`}
                title={
                  disabled
                    ? `Hosting ${status}`
                    : "Hosting"
                }
              />
            );
          }
        );

      })()}

      {/* =====================================================
          WEBSITE
      ===================================================== */}

      {(() => {

        const websitePlans =
          order?.Plans?.filter(
            (plan: any) =>
              plan?.type?.toLowerCase() ===
              "website"
          ) || [];

        if (
          websitePlans.length === 0
        ) {
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

            const status =
              getPlanPrimaryStatus(
                plan
              );

            return (
              <FaLaptopCode
                key={`website-${index}`}
                className={`w-6 h-6 ${
                  disabled
                    ? "text-gray-400 opacity-40 grayscale"
                    : "text-blue-500"
                }`}
                title={
                  disabled
                    ? `Website ${status}`
                    : "Website"
                }
              />
            );
          }
        );

      })()}

      {/* =====================================================
          MS OFFICE
      ===================================================== */}

      {order?.Plans
        ?.filter(
          (plan: any) =>
            plan?.type?.toLowerCase() ===
            "msoffice"
        )
        .map(
          (
            plan: any,
            index: number
          ) => {

            const disabled =
              isPlanDisabled(plan);

            const status =
              getPlanPrimaryStatus(
                plan
              );

            return (
              <div
                key={`msoffice-${index}`}
                className={`relative inline-block ${
                  disabled
                    ? "opacity-40 grayscale pointer-events-none"
                    : ""
                }`}
                onMouseEnter={
                  disabled
                    ? undefined
                    : handleMsofficeHover
                }
                onMouseLeave={() =>
                  setIsHovering(false)
                }
                title={
                  disabled
                    ? `MS Office ${status}`
                    : plan?.emailType ||
                      "MS Office"
                }
              >

                {disabled ? (

                  <FaEnvelope
                    className="w-6 h-6 text-gray-400"
                    title={`MS Office ${status}`}
                  />

                ) : (

                  <img
                    src={getEmailImageUrl(
                      plan
                    )}
                    className="w-6 h-6 object-contain cursor-pointer"
                    title={
                      plan?.emailType ||
                      "MS Office"
                    }
                  />

                )}

                <span className="absolute -top-2 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-[300] border border-white">
                  {plan?.noOfUsers ??
                    0}
                </span>

              </div>
            );
          }
        )}

      {/* =====================================================
          SSL
      ===================================================== */}

      {order?.Plans
        ?.filter(
          (plan: any) =>
            plan?.type?.toLowerCase() ===
            "ssl"
        )
        .map(
          (
            plan: any,
            index: number
          ) => {

            const disabled =
              isPlanDisabled(plan);

            const status =
              getPlanPrimaryStatus(
                plan
              );

            return (
              <FaLock
                key={`ssl-${index}`}
                className={`w-6 h-6 ${
                  disabled
                    ? "text-gray-400 opacity-40 grayscale"
                    : "text-yellow-500"
                }`}
                title={
                  disabled
                    ? `SSL ${status}`
                    : "SSL"
                }
              />
            );
          }
        )}

    </div>
  );
}