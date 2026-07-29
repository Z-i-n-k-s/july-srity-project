import SummaryApi from "../common";
import { sleep } from "./utils";

export const DEMO_FALLBACK = String(process.env.REACT_APP_DEMO_FALLBACK ?? "false") !== "false";

const messageFrom = (payload) => payload?.message || payload?.error || "Something went wrong.";
const unwrap = (payload) => payload?.data ?? payload?.results ?? payload;

export async function apiRequest(endpoint, options = {}) {
  const url = typeof endpoint === "string" ? endpoint : endpoint.url;
  const method = options.method || endpoint?.method || "get";
  const headers = new Headers(options.headers || {});
  const isFormData = options.body instanceof FormData;
  if (!isFormData && options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(url, {
    ...options,
    method,
    credentials: "include",
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok || payload?.error) throw new Error(messageFrom(payload));
  return payload;
}

async function requestOrFallback(endpoint, options, fallback) {
  try {
    return await apiRequest(endpoint, options);
  } catch (error) {
    if (!DEMO_FALLBACK || !fallback) throw error;
    await sleep(250);
    return typeof fallback === "function" ? fallback(error) : fallback;
  }
}

export const publicApi = {
  archive: (fallback) => requestOrFallback(SummaryApi.publicArchive, {}, fallback),
  archiveDetail: (id, fallback) => requestOrFallback(`${SummaryApi.publicArchive.url}/${id}`, {}, fallback),
  stories: (fallback) => requestOrFallback(SummaryApi.publicStories, {}, fallback),
  storyDetail: (id, fallback) => requestOrFallback(`${SummaryApi.publicStories.url}/${id}`, {}, fallback),
  timeline: (fallback) => requestOrFallback(SummaryApi.publicTimeline, {}, fallback),
  missingPersons: (fallback) => requestOrFallback(SummaryApi.publicMissingPersons, {}, fallback),
  missingPerson: (id, fallback) => requestOrFallback(`${SummaryApi.publicMissingPersons.url}/${id}`, {}, fallback),
};

export const userApi = {
  updateProfile: async (values) => unwrap(await apiRequest(SummaryApi.updateProfile, {
    method: SummaryApi.updateProfile.method,
    body: JSON.stringify(values),
  })),
  submitEvidence: (formData) => requestOrFallback(SummaryApi.submitEvidence, {
    method: SummaryApi.submitEvidence.method,
    body: formData,
  }, () => ({ success: true, data: { id: `SUB-${Date.now()}` } })),
  getMySubmissions: (fallback) => requestOrFallback(SummaryApi.mySubmissions, {}, fallback),
  createSupportRequest: (values) => {
    const body = values instanceof FormData ? values : JSON.stringify(values);
    return requestOrFallback(SummaryApi.createSupportRequest, {
      method: SummaryApi.createSupportRequest.method,
      body,
    }, () => ({ success: true, data: { id: `JS-HELP-${String(Date.now()).slice(-6)}` } }));
  },
  getSupportRooms: (fallback) => requestOrFallback(SummaryApi.mySupportRooms, {}, fallback),
  getSupportRoom: (roomId, fallback) => requestOrFallback(`${SummaryApi.supportRoom.url}/${roomId}`, {}, fallback),
  sendSupportMessage: (roomId, formData) => requestOrFallback(`${SummaryApi.supportMessage.url}/${roomId}/messages`, {
    method: SummaryApi.supportMessage.method,
    body: formData,
  }, { success: true }),
  reportMissingPerson: (formData) => requestOrFallback(SummaryApi.reportMissingPerson, {
    method: SummaryApi.reportMissingPerson.method,
    body: formData,
  }, () => ({ success: true, data: { id: `MPR-${Date.now()}` } })),
  getMyMissingReports: (fallback) => requestOrFallback(SummaryApi.myMissingReports, {}, fallback),
  reportSighting: (personId, values) => requestOrFallback(`${SummaryApi.reportSighting.url}/${personId}/sightings`, {
    method: SummaryApi.reportSighting.method,
    body: JSON.stringify(values),
  }, { success: true }),
};

export const adminApi = {
  dashboard: (fallback) => requestOrFallback(SummaryApi.adminDashboard, {}, fallback),
  submissions: (fallback) => requestOrFallback(SummaryApi.adminSubmissions, {}, fallback),
  reviewSubmission: (id, values) => requestOrFallback(`${SummaryApi.adminReviewSubmission.url}/${id}/review`, {
    method: SummaryApi.adminReviewSubmission.method,
    body: JSON.stringify(values),
  }, { success: true }),
  supportCases: (fallback) => requestOrFallback(SummaryApi.adminSupportCases, {}, fallback),
  supportCase: (id, fallback) => requestOrFallback(`${SummaryApi.adminSupportCase.url}/${id}`, {}, fallback),
  sendSupportMessage: (id, formData) => requestOrFallback(`${SummaryApi.adminSupportMessage.url}/${id}/messages`, {
    method: SummaryApi.adminSupportMessage.method,
    body: formData,
  }, { success: true }),
  verifyMedicalDocument: (caseId, documentId, values) => requestOrFallback(`${SummaryApi.adminVerifyMedicalDocument.url}/${caseId}/documents/${documentId}/verify`, {
    method: SummaryApi.adminVerifyMedicalDocument.method,
    body: JSON.stringify(values),
  }, { success: true }),
  missingReports: (fallback) => requestOrFallback(SummaryApi.adminMissingReports, {}, fallback),
  reviewMissingReport: (id, values) => requestOrFallback(`${SummaryApi.adminReviewMissingReport.url}/${id}/review`, {
    method: SummaryApi.adminReviewMissingReport.method,
    body: JSON.stringify(values),
  }, { success: true }),
  archive: (fallback) => requestOrFallback(SummaryApi.adminArchive, {}, fallback),
  publishArchive: (id, values) => requestOrFallback(`${SummaryApi.adminPublishArchive.url}/${id}/publish`, {
    method: SummaryApi.adminPublishArchive.method,
    body: JSON.stringify(values),
  }, { success: true }),
};

export { unwrap };
