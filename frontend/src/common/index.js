const backendDomin = process.env.REACT_APP_BACKEND_URL || "http://localhost:8080";

const endpoint = (path, method = "get") => ({ url: `${backendDomin}${path}`, method });

const SummaryApi = {
  signUP: endpoint("/api/signup", "post"),
  signIn: endpoint("/api/signin", "post"),
  current_user: endpoint("/api/user-details", "get"),
  forgotPassword: endpoint("/api/forgot-password", "post"),
  verifyResetToken: endpoint("/api/verify-reset-token", "get"),
  resetPassword: endpoint("/api/reset-password", "post"),
  logout_user: endpoint("/api/userLogout", "get"),
  allUser: endpoint("/api/all-user", "get"),
  userSearch: endpoint("/api/user-search", "post"),
  updateUser: endpoint("/api/update-user", "post"),
  updateProfile: endpoint("/api/update-profile", "post"),
  deleteUser: endpoint("/api/delete-user", "post"),

  publicArchive: endpoint("/api/archive", "get"),
  publicStories: endpoint("/api/stories", "get"),
  publicTimeline: endpoint("/api/timeline", "get"),
  publicMissingPersons: endpoint("/api/missing-persons", "get"),

  submitEvidence: endpoint("/api/submissions", "post"),
  mySubmissions: endpoint("/api/submissions/my", "get"),
  submissionDetails: endpoint("/api/submissions", "get"),
  saveDraft: endpoint("/api/submissions/drafts", "post"),

  createSupportRequest: endpoint("/api/support/requests", "post"),
  mySupportRooms: endpoint("/api/support/rooms", "get"),
  supportRoom: endpoint("/api/support/rooms", "get"),
  supportMessage: endpoint("/api/support/rooms", "post"),

  reportMissingPerson: endpoint("/api/missing-persons/reports", "post"),
  myMissingReports: endpoint("/api/missing-persons/reports/my", "get"),
  reportSighting: endpoint("/api/missing-persons", "post"),

  adminDashboard: endpoint("/api/admin/dashboard", "get"),
  adminSubmissions: endpoint("/api/admin/submissions", "get"),
  adminReviewSubmission: endpoint("/api/admin/submissions", "post"),
  adminSupportCases: endpoint("/api/admin/support-cases", "get"),
  adminSupportCase: endpoint("/api/admin/support-cases", "get"),
  adminSupportMessage: endpoint("/api/admin/support-cases", "post"),
  adminVerifyMedicalDocument: endpoint("/api/admin/support-cases", "post"),
  adminMissingReports: endpoint("/api/admin/missing-reports", "get"),
  adminReviewMissingReport: endpoint("/api/admin/missing-reports", "post"),
  adminArchive: endpoint("/api/admin/archive", "get"),
  adminPublishArchive: endpoint("/api/admin/archive", "post"),
};

export { backendDomin };
export default SummaryApi;
