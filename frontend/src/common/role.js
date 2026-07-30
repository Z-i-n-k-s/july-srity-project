const ROLE = Object.freeze({
  ADMIN: "ADMIN",
  USER: "USER",
});

export const normalizeRole = (role) => String(role || "").trim().toUpperCase();

export const getUserRole = (user) => normalizeRole(user?.role) || ROLE.USER;

export const isAdminUser = (user) => getUserRole(user) === ROLE.ADMIN;

export const getDefaultRouteForUser = (user) => (
  isAdminUser(user) ? "/admin-panel" : "/home"
);

export default ROLE;
