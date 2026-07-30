import SummaryApi from "../common";
import { sleep } from "./utils";

export const DEMO_FALLBACK =
  String(
    process.env.REACT_APP_DEMO_FALLBACK ?? "false",
  ).toLowerCase() !== "false";

const messageFrom = (payload) => {
  if (typeof payload === "string") {
    return payload || "Something went wrong.";
  }

  if (typeof payload?.error === "string") {
    return payload.error;
  }

  if (payload?.error?.message) {
    return payload.error.message;
  }

  return payload?.message || "Something went wrong.";
};

const unwrap = (payload) =>
  payload?.data ?? payload?.results ?? payload;

function requireId(id, message) {
  if (
    id === null ||
    id === undefined ||
    String(id).trim() === ""
  ) {
    throw new Error(message);
  }

  return String(id).trim();
}

function appendId(baseUrl, id) {
  return `${baseUrl}/${encodeURIComponent(id)}`;
}

export async function apiRequest(
  endpoint,
  options = {},
) {
  const endpointConfig =
    typeof endpoint === "string"
      ? {
          url: endpoint,
          method: "GET",
        }
      : endpoint;

  if (!endpointConfig?.url) {
    throw new Error(
      "API endpoint URL is missing. Check src/common/index.js.",
    );
  }

  const method = String(
    options.method ||
      endpointConfig.method ||
      "GET",
  ).toUpperCase();

  const headers = new Headers(
    options.headers || {},
  );

  const requestOptions = {
    ...options,
    method,
    credentials:
      options.credentials || "include",
    headers,
  };

  /*
   * GET and HEAD requests cannot contain a body.
   */
  if (method === "GET" || method === "HEAD") {
    delete requestOptions.body;
    headers.delete("Content-Type");
  } else {
    const hasBody =
      requestOptions.body !== undefined &&
      requestOptions.body !== null;

    const isFormData =
      typeof FormData !== "undefined" &&
      requestOptions.body instanceof FormData;

    if (
      hasBody &&
      !isFormData &&
      !headers.has("Content-Type")
    ) {
      headers.set(
        "Content-Type",
        "application/json",
      );
    }
  }

  const response = await fetch(
    endpointConfig.url,
    requestOptions,
  );

  const contentType =
    response.headers.get("content-type") || "";

  const responseText = await response.text();

  let payload = null;

  if (responseText) {
    if (
      contentType.includes("application/json")
    ) {
      try {
        payload = JSON.parse(responseText);
      } catch {
        throw new Error(
          "The backend returned invalid JSON.",
        );
      }
    } else {
      payload = responseText;
    }
  }

  const hasApiError =
    payload?.success === false ||
    payload?.error === true ||
    typeof payload?.error === "string" ||
    Boolean(payload?.error?.message);

  if (!response.ok || hasApiError) {
    throw new Error(messageFrom(payload));
  }

  return payload;
}

async function requestOrFallback(
  endpoint,
  options = {},
  fallback,
) {
  try {
    return await apiRequest(endpoint, options);
  } catch (error) {
    const hasFallback =
      fallback !== undefined;

    if (!DEMO_FALLBACK || !hasFallback) {
      throw error;
    }

    await sleep(250);

    return typeof fallback === "function"
      ? fallback(error)
      : fallback;
  }
}

/* -------------------------------------------------------------------------- */
/*                                PUBLIC API                                  */
/* -------------------------------------------------------------------------- */

export const publicApi = {
  archive: (fallback) =>
    requestOrFallback(
      SummaryApi.publicArchive,
      {
        method:
          SummaryApi.publicArchive.method,
      },
      fallback,
    ),

  archiveDetail: (id, fallback) => {
    const safeId = requireId(
      id,
      "Archive record ID is required.",
    );

    return requestOrFallback(
      appendId(
        SummaryApi.publicArchive.url,
        safeId,
      ),
      {
        method: "GET",
      },
      fallback,
    );
  },

  stories: (fallback) =>
    requestOrFallback(
      SummaryApi.publicStories,
      {
        method:
          SummaryApi.publicStories.method,
      },
      fallback,
    ),

  storyDetail: (id, fallback) => {
    const safeId = requireId(
      id,
      "Story ID is required.",
    );

    return requestOrFallback(
      appendId(
        SummaryApi.publicStories.url,
        safeId,
      ),
      {
        method: "GET",
      },
      fallback,
    );
  },

  timeline: (fallback) =>
    requestOrFallback(
      SummaryApi.publicTimeline,
      {
        method:
          SummaryApi.publicTimeline.method,
      },
      fallback,
    ),
memoryMapSummary: (fallback) =>
  requestOrFallback(
    SummaryApi.memoryMapSummary,
    {
      method: SummaryApi.memoryMapSummary.method,
    },
    fallback,
  ),

memoryMapMemories: (
  division,
  options = {},
  fallback,
) => {
  const safeDivision = requireId(
    division,
    "Bangladesh division is required.",
  );

  const api =
    SummaryApi.memoryMapMemories(safeDivision);

  const params = new URLSearchParams();

  if (
    options.type &&
    options.type !== "all"
  ) {
    params.set("type", options.type);
  }

  if (options.cursor) {
    params.set("cursor", options.cursor);
  }

  if (options.limit) {
    params.set(
      "limit",
      String(options.limit),
    );
  }

  const query = params.toString();

  return requestOrFallback(
    {
      ...api,
      url: query
        ? `${api.url}?${query}`
        : api.url,
    },
    {
      method: api.method,
    },
    fallback,
  );
},
  missingPersons: (fallback) =>
    requestOrFallback(
      SummaryApi.publicMissingPersons,
      {
        method:
          SummaryApi.publicMissingPersons.method,
      },
      fallback,
    ),

  missingPerson: (id, fallback) => {
    const safeId = requireId(
      id,
      "Missing-person report ID is required.",
    );

    /*
     * publicMissingPerson is a function in common/index.js.
     */
    const api =
      SummaryApi.publicMissingPerson(safeId);

    return requestOrFallback(
      api,
      {
        method: api.method,
      },
      fallback,
    );
  },
};

/* -------------------------------------------------------------------------- */
/*                                  USER API                                  */
/* -------------------------------------------------------------------------- */

export const userApi = {
  updateProfile: async (values) =>
    unwrap(
      await apiRequest(
        SummaryApi.updateProfile,
        {
          method:
            SummaryApi.updateProfile.method,
          body: JSON.stringify(values),
        },
      ),
    ),

  submitEvidence: (formData) =>
    requestOrFallback(
      SummaryApi.submitEvidence,
      {
        method:
          SummaryApi.submitEvidence.method,
        body: formData,
      },
      () => ({
        success: true,
        data: {
          id: `SUB-${Date.now()}`,
        },
      }),
    ),

  getMySubmissions: (fallback) =>
    requestOrFallback(
      SummaryApi.mySubmissions,
      {
        method:
          SummaryApi.mySubmissions.method,
      },
      fallback,
    ),

  createSupportRequest: (values) => {
    const isFormData =
      typeof FormData !== "undefined" &&
      values instanceof FormData;

    const body = isFormData
      ? values
      : JSON.stringify(values);

    return requestOrFallback(
      SummaryApi.createSupportRequest,
      {
        method:
          SummaryApi.createSupportRequest.method,
        body,
      },
      () => ({
        success: true,
        data: {
          id: `JS-HELP-${String(
            Date.now(),
          ).slice(-6)}`,
        },
      }),
    );
  },

  getSupportRooms: (fallback) =>
    requestOrFallback(
      SummaryApi.mySupportRooms,
      {
        method:
          SummaryApi.mySupportRooms.method,
      },
      fallback,
    ),

  getSupportRoom: (roomId, fallback) => {
    const safeRoomId = requireId(
      roomId,
      "Support room ID is required.",
    );

    return requestOrFallback(
      appendId(
        SummaryApi.supportRoom.url,
        safeRoomId,
      ),
      {
        method: "GET",
      },
      fallback,
    );
  },

  sendSupportMessage: (
    roomId,
    formData,
  ) => {
    const safeRoomId = requireId(
      roomId,
      "Support room ID is required.",
    );

    return requestOrFallback(
      `${appendId(
        SummaryApi.supportMessage.url,
        safeRoomId,
      )}/messages`,
      {
        method:
          SummaryApi.supportMessage.method,
        body: formData,
      },
      {
        success: true,
      },
    );
  },

  reportMissingPerson: (formData) =>
    requestOrFallback(
      SummaryApi.reportMissingPerson,
      {
        method:
          SummaryApi.reportMissingPerson.method,
        body: formData,
      },
      () => ({
        success: true,
        data: {
          id: `MPR-${Date.now()}`,
        },
      }),
    ),

  getMyMissingReports: (fallback) =>
    requestOrFallback(
      SummaryApi.myMissingReports,
      {
        method:
          SummaryApi.myMissingReports.method,
      },
      fallback,
    ),

  reportSighting: (
    reportId,
    values,
  ) => {
    const safeReportId = requireId(
      reportId,
      "Missing-person report ID is required.",
    );

    /*
     * reportSighting is a function in common/index.js.
     */
    const api =
      SummaryApi.reportSighting(
        safeReportId,
      );

    return requestOrFallback(
      api,
      {
        method: api.method,
        body: JSON.stringify(values),
      },
      {
        success: true,
      },
    );
  },
};

/* -------------------------------------------------------------------------- */
/*                                 ADMIN API                                  */
/* -------------------------------------------------------------------------- */

export const adminApi = {
  dashboard: () =>
    apiRequest(SummaryApi.adminDashboard, {
      method: SummaryApi.adminDashboard.method,
    }),

  submissions: () =>
    apiRequest(SummaryApi.adminSubmissions, {
      method: SummaryApi.adminSubmissions.method,
    }),

  reviewSubmission: (id, values) => {
    const safeId = requireId(
      id,
      "Submission ID is required.",
    );

    return apiRequest(
      `${appendId(
        SummaryApi.adminReviewSubmission.url,
        safeId,
      )}/review`,
      {
        method:
          SummaryApi.adminReviewSubmission
            .method,
        body: JSON.stringify(values),
      },
    );
  },

  supportCases: () =>
    apiRequest(SummaryApi.adminSupportCases, {
      method: SummaryApi.adminSupportCases.method,
    }),

  supportCase: (id) => {
    const safeId = requireId(
      id,
      "Support case ID is required.",
    );

    return apiRequest(
      appendId(
        SummaryApi.adminSupportCase.url,
        safeId,
      ),
      { method: "GET" },
    );
  },

  sendSupportMessage: (id, formData) => {
    const safeId = requireId(
      id,
      "Support case ID is required.",
    );

    return apiRequest(
      `${appendId(
        SummaryApi.adminSupportMessage.url,
        safeId,
      )}/messages`,
      {
        method:
          SummaryApi.adminSupportMessage
            .method,
        body: formData,
      },
    );
  },

  verifyMedicalDocument: (
    caseId,
    documentId,
    values,
  ) => {
    const safeCaseId = requireId(
      caseId,
      "Support case ID is required.",
    );

    const safeDocumentId = requireId(
      documentId,
      "Medical document ID is required.",
    );

    return apiRequest(
      `${appendId(
        SummaryApi.adminVerifyMedicalDocument
          .url,
        safeCaseId,
      )}/documents/${encodeURIComponent(
        safeDocumentId,
      )}/verify`,
      {
        method:
          SummaryApi
            .adminVerifyMedicalDocument
            .method,
        body: JSON.stringify(values),
      },
    );
  },

  missingReports: () =>
    apiRequest(SummaryApi.missingAdminReports, {
      method: SummaryApi.missingAdminReports.method,
    }),

  missingReport: (reportId) => {
    const safeReportId = requireId(
      reportId,
      "Missing-person report ID is required.",
    );

    const api = SummaryApi.missingReport(
      safeReportId,
    );

    return apiRequest(api, {
      method: api.method,
    });
  },

  changeMissingStatus: (
    reportId,
    values,
  ) => {
    const safeReportId = requireId(
      reportId,
      "Missing-person report ID is required.",
    );

    const api = SummaryApi.missingReportStatus(
      safeReportId,
    );

    return apiRequest(api, {
      method: api.method,
      body: JSON.stringify(values),
    });
  },

  assignMissingAdmins: (
    reportId,
    values,
  ) => {
    const safeReportId = requireId(
      reportId,
      "Missing-person report ID is required.",
    );

    const api = SummaryApi.missingAssignAdmins(
      safeReportId,
    );

    return apiRequest(api, {
      method: api.method,
      body: JSON.stringify(values),
    });
  },

  changeSightingStatus: (
    reportId,
    sightingId,
    values,
  ) => {
    const safeReportId = requireId(
      reportId,
      "Missing-person report ID is required.",
    );

    const safeSightingId = requireId(
      sightingId,
      "Sighting ID is required.",
    );

    const api = SummaryApi.missingSightingStatus(
      safeReportId,
      safeSightingId,
    );

    return apiRequest(api, {
      method: api.method,
      body: JSON.stringify(values),
    });
  },

  archive: () =>
    apiRequest(SummaryApi.adminArchive, {
      method: SummaryApi.adminArchive.method,
    }),

  publishArchive: (id, values) => {
    const safeId = requireId(
      id,
      "Archive record ID is required.",
    );

    return apiRequest(
      `${appendId(
        SummaryApi.adminPublishArchive.url,
        safeId,
      )}/publish`,
      {
        method:
          SummaryApi.adminPublishArchive.method,
        body: JSON.stringify(values),
      },
    );
  },
};

export { unwrap };