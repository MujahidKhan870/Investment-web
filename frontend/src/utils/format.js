/**
 * Formats a number as Indian Rupees (₹) with proper local comma separators (en-IN).
 * Example: 150000 -> ₹1,50,000.00
 */
export const formatRupee = (value) => {
  const num = Number(value);
  if (isNaN(num)) return '₹0.00';
  return '₹' + new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

/**
 * Formats large amounts using Lakhs and Crores abbreviations.
 * Example: 12500000 -> ₹1.25 Cr
 */
export const formatRupeeShort = (value) => {
  const num = Number(value);
  if (isNaN(num)) return '₹0';
  if (num >= 10000000) {
    return '₹' + (num / 10000000).toFixed(2) + ' Cr';
  }
  if (num >= 100000) {
    return '₹' + (num / 100000).toFixed(2) + ' Lk';
  }
  return '₹' + new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(num);
};
