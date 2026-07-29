export const cn = (...classes) => classes.filter(Boolean).join(" ");

export const formatDate = (value) => {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export const makeId = (prefix = "JS") => {
  const time = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${time}-${random}`;
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const normaliseStatus = (status = "") => status.toLowerCase().trim().replace(/\s+/g, "-");
