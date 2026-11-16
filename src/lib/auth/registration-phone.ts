export const REGISTRATION_COUNTRIES = [
  { code: "NG", name: "Nigeria", dialCode: "234", trunkPrefix: "0" },
  { code: "GH", name: "Ghana", dialCode: "233", trunkPrefix: "0" },
  { code: "KE", name: "Kenya", dialCode: "254", trunkPrefix: "0" },
  { code: "ZA", name: "South Africa", dialCode: "27", trunkPrefix: "0" },
  { code: "GB", name: "United Kingdom", dialCode: "44", trunkPrefix: "0" },
  { code: "US", name: "United States", dialCode: "1", trunkPrefix: "" },
  { code: "CA", name: "Canada", dialCode: "1", trunkPrefix: "" },
  { code: "IN", name: "India", dialCode: "91", trunkPrefix: "0" },
  { code: "AE", name: "United Arab Emirates", dialCode: "971", trunkPrefix: "0" },
] as const;

export function normalizeRegistrationPhone(
  countryCode: string,
  input: string,
) {
  const country = REGISTRATION_COUNTRIES.find(
    (item) => item.code === countryCode,
  );

  if (!country) {
    throw new Error("Choose a supported country.");
  }

  const trimmed = input.trim();
  let digits = trimmed.replace(/\D/g, "");

  if (!digits) {
    throw new Error("Enter a valid phone number.");
  }

  const hasInternationalPrefix = trimmed.startsWith("+");
  if (hasInternationalPrefix) {
    if (!digits.startsWith(country.dialCode)) {
      throw new Error("The phone number country prefix does not match the selected country.");
    }
    digits = digits.slice(country.dialCode.length);
  } else if (
    digits.startsWith(country.dialCode) &&
    digits.length > country.dialCode.length + 6
  ) {
    digits = digits.slice(country.dialCode.length);
  }

  if (country.trunkPrefix && digits.startsWith(country.trunkPrefix)) {
    digits = digits.slice(country.trunkPrefix.length);
  }

  const normalized = `+${country.dialCode}${digits}`;
  const totalDigits = normalized.length - 1;

  if (!/^\+[1-9]\d{6,14}$/.test(normalized) || totalDigits > 15) {
    throw new Error("Enter a valid phone number for the selected country.");
  }

  return normalized;
}
