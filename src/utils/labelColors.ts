const labelColors: Record<string, string> = {
  QATAR: "bg-purple-100 text-purple-800 border border-purple-200",
  INDIA: "bg-orange-100 text-orange-800 border border-orange-200",
  TRIAL: "bg-cyan-100 text-cyan-800 border border-cyan-200",
  LEGACY_FREE: "bg-gray-100 text-gray-700 border border-gray-200",
  FREE: "bg-gray-100 text-gray-700 border border-gray-200",
  EDUCATION: "bg-indigo-100 text-indigo-800 border border-indigo-200",
  DIRECT_BILLING: "bg-green-100 text-green-800 border border-green-200",
  SUSPENDED: "bg-red-100 text-red-800 border border-red-200",
  SIGNIN_BLOCKED: "bg-rose-100 text-rose-800 border border-rose-200",
  "SIGN-IN BLOCKED": "bg-rose-100 text-rose-800 border border-rose-200",
};

export const getLabelColor = (code: string) => {
  const normalizedCode = code?.trim().toUpperCase();
  return labelColors[normalizedCode] || "bg-blue-100 text-blue-800";
};