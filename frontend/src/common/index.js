const backendDomin =
  process.env.REACT_APP_BACKEND_URL ||
  "http://localhost:8080";

const cleanBackendDomain = backendDomin.replace(/\/+$/, "");

const endpoint = (path, method = "GET") => ({
  url: `${cleanBackendDomain}${path}`,
  method: method.toUpperCase(),
});

const SummaryApi = {
  /* ------------------------------------------------------------------------ */
  /* Authentication                                                           */
  /* ------------------------------------------------------------------------ */

  signUP: endpoint("/api/signup", "POST"),
  signIn: endpoint("/api/signin", "POST"),
  current_user: endpoint("/api/user-details", "GET"),
  forgotPassword: endpoint(
    "/api/forgot-password",
    "POST",
  ),
  verifyResetToken: endpoint(
    "/api/verify-reset-token",
    "GET",
  ),
  resetPassword: endpoint(
    "/api/reset-password",
    "POST",
  ),
  logout_user: endpoint("/api/userLogout", "GET"),

  /* ------------------------------------------------------------------------ */
  /* User administration                                                      */
  /* ------------------------------------------------------------------------ */

  allUser: endpoint("/api/all-user", "GET"),
  userSearch: endpoint("/api/user-search", "POST"),
  updateUser: endpoint("/api/update-user", "POST"),
  updateProfile: endpoint(
    "/api/update-profile",
    "POST",
  ),
  deleteUser: endpoint("/api/delete-user", "POST"),

  /* ------------------------------------------------------------------------ */
  /* Public archive                                                           */
  /* ------------------------------------------------------------------------ */

  publicArchive: endpoint("/api/archive", "GET"),
  publicStories: endpoint("/api/stories", "GET"),
  publicTimeline: endpoint("/api/timeline", "GET"),

  /* ------------------------------------------------------------------------ */
  /* Documentary submissions                                                  */
  /* ------------------------------------------------------------------------ */

  submitEvidence: endpoint("/api/submissions", "POST"),
  mySubmissions: endpoint(
    "/api/submissions/my",
    "GET",
  ),
  submissionDetails: endpoint(
    "/api/submissions",
    "GET",
  ),
  saveDraft: endpoint(
    "/api/submissions/drafts",
    "POST",
  ),

  /* ------------------------------------------------------------------------ */
  /* Support                                                                  */
  /* ------------------------------------------------------------------------ */

  createSupportRequest: endpoint(
    "/api/support/requests",
    "POST",
  ),
  mySupportRooms: endpoint(
    "/api/support/rooms",
    "GET",
  ),
  supportRoom: endpoint(
    "/api/support/rooms",
    "GET",
  ),
  supportMessage: endpoint(
    "/api/support/rooms",
    "POST",
  ),

  /* ------------------------------------------------------------------------ */
  /* Missing-person public and user routes                                    */
  /* ------------------------------------------------------------------------ */

  publicMissingPersons: endpoint(
    "/api/missing-persons",
    "GET",
  ),

  publicMissingPerson: (reportId) =>
    endpoint(
      `/api/missing-persons/public/${encodeURIComponent(
        reportId,
      )}`,
      "GET",
    ),

  reportMissingPerson: endpoint(
    "/api/missing-persons",
    "POST",
  ),

  myMissingReports: endpoint(
    "/api/missing-persons/mine",
    "GET",
  ),

  reportSighting: (reportId) =>
    endpoint(
      `/api/missing-persons/${encodeURIComponent(
        reportId,
      )}/sightings`,
      "POST",
    ),

  updateMissingReport: (reportId) =>
    endpoint(
      `/api/missing-persons/${encodeURIComponent(
        reportId,
      )}`,
      "PATCH",
    ),

  submitMissingReport: (reportId) =>
    endpoint(
      `/api/missing-persons/${encodeURIComponent(
        reportId,
      )}/submit`,
      "POST",
    ),

  deleteMissingReport: (reportId) =>
    endpoint(
      `/api/missing-persons/${encodeURIComponent(
        reportId,
      )}`,
      "DELETE",
    ),

  /* ------------------------------------------------------------------------ */
  /* Admin dashboard                                                          */
  /* ------------------------------------------------------------------------ */

  adminDashboard: endpoint(
    "/api/admin/dashboard",
    "GET",
  ),

  adminSubmissions: endpoint(
    "/api/admin/submissions",
    "GET",
  ),

  adminReviewSubmission: endpoint(
    "/api/admin/submissions",
    "POST",
  ),

  adminSupportCases: endpoint(
    "/api/admin/support-cases",
    "GET",
  ),

  adminSupportCase: endpoint(
    "/api/admin/support-cases",
    "GET",
  ),

  adminSupportMessage: endpoint(
    "/api/admin/support-cases",
    "POST",
  ),

  adminVerifyMedicalDocument: endpoint(
    "/api/admin/support-cases",
    "POST",
  ),

  /* ------------------------------------------------------------------------ */
  /* Admin missing-person routes                                              */
  /* ------------------------------------------------------------------------ */

  missingAdminReports: endpoint(
    "/api/missing-persons/admin",
    "GET",
  ),

  missingReport: (reportId) =>
    endpoint(
      `/api/missing-persons/${encodeURIComponent(
        reportId,
      )}`,
      "GET",
    ),

  missingReportStatus: (reportId) =>
    endpoint(
      `/api/missing-persons/${encodeURIComponent(
        reportId,
      )}/status`,
      "PATCH",
    ),

  missingAssignAdmins: (reportId) =>
    endpoint(
      `/api/missing-persons/${encodeURIComponent(
        reportId,
      )}/assign`,
      "PATCH",
    ),

  missingSightingStatus: (
    reportId,
    sightingId,
  ) =>
    endpoint(
      `/api/missing-persons/${encodeURIComponent(
        reportId,
      )}/sightings/${encodeURIComponent(
        sightingId,
      )}/status`,
      "PATCH",
    ),

  /* ------------------------------------------------------------------------ */
  /* Admin archive                                                            */
  /* ------------------------------------------------------------------------ */

  adminArchive: endpoint(
    "/api/admin/archive",
    "GET",
  ),

  adminPublishArchive: endpoint(
    "/api/admin/archive",
    "POST",
  ),
};

export { cleanBackendDomain as backendDomin };
export default SummaryApi;