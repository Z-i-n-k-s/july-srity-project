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

export const toLocalDateInputValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const isFutureLocalDateTime = (dateValue, timeValue = "") => {
  if (!dateValue) return false;
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hours = 0, minutes = 0] = timeValue ? timeValue.split(":").map(Number) : [0, 0];
  const candidate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return !Number.isNaN(candidate.getTime()) && candidate.getTime() > Date.now();
};

export const makeId = (prefix = "JS") => {
  const time = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${time}-${random}`;
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const normaliseStatus = (status = "") => status.toLowerCase().trim().replace(/\s+/g, "-");
