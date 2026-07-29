const express = require("express");
const consent = require("../controllers/consentController");
const moderation = require("../controllers/moderationController");
const admin = require("../controllers/adminController");
const { authenticate } = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const validateObjectId = require("../middleware/validateObjectId");

/**
 * @openapi
 * /governance/consents/mine:
 *   get:
 *     tags:
 *     - Consent
 *     summary: List the current user's consent records
 *     operationId: get_governance_consents_mine
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: List the current user's consent records successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedSuccessResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     parameters:
 *     - $ref: '#/components/parameters/PageParam'
 *     - $ref: '#/components/parameters/LimitParam'
 *     - name: targetType
 *       in: query
 *       required: false
 *       description: Filter by targetType.
 *       schema:
 *         type: string
 *         enum:
 *         - DOCUMENTARY_SUBMISSION
 *         - SUPPORT_CASE
 *         - MISSING_PERSON_REPORT
 *     - name: targetId
 *       in: query
 *       required: false
 *       description: Filter by targetId.
 *       schema:
 *         type: string
 *     - name: consentType
 *       in: query
 *       required: false
 *       description: Filter by consentType.
 *       schema:
 *         type: string
 *         enum:
 *         - DATA_PROCESSING
 *         - PUBLICATION
 *         - MEDICAL_DATA_PROCESSING
 *         - IDENTITY_VERIFICATION
 *         - CONTACT_SHARING
 *         - FAMILY_PARTICIPANT_ACCESS
 * /governance/consents:
 *   post:
 *     tags:
 *     - Consent
 *     summary: Grant or record consent
 *     operationId: post_governance_consents
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '201':
 *         description: Grant or record consent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '422':
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConsentGrantRequest'
 * /governance/consents/{consentId}/withdraw:
 *   post:
 *     tags:
 *     - Consent
 *     summary: Withdraw an active consent
 *     operationId: post_governance_consents_consentId_withdraw
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Withdraw an active consent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '422':
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     parameters:
 *     - name: consentId
 *       in: path
 *       required: true
 *       description: consentId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 * /governance/moderation-reports:
 *   post:
 *     tags:
 *     - Moderation
 *     summary: Report content or a user for moderation
 *     operationId: post_governance_moderation_reports
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '201':
 *         description: Report content or a user for moderation successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '409':
 *         $ref: '#/components/responses/Conflict'
 *       '422':
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ModerationCreateRequest'
 * /governance/moderation-reports/mine:
 *   get:
 *     tags:
 *     - Moderation
 *     summary: List the current user's moderation reports
 *     operationId: get_governance_moderation_reports_mine
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: List the current user's moderation reports successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedSuccessResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     parameters:
 *     - $ref: '#/components/parameters/PageParam'
 *     - $ref: '#/components/parameters/LimitParam'
 * /governance/moderation-reports/admin:
 *   get:
 *     tags:
 *     - Moderation
 *     summary: List all moderation reports
 *     operationId: get_governance_moderation_reports_admin
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: List all moderation reports successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedSuccessResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     x-required-role: ADMIN
 *     description: Requires an active ADMIN account.
 *     parameters:
 *     - $ref: '#/components/parameters/PageParam'
 *     - $ref: '#/components/parameters/LimitParam'
 *     - name: status
 *       in: query
 *       required: false
 *       description: Filter by status.
 *       schema:
 *         type: string
 *         enum:
 *         - OPEN
 *         - UNDER_REVIEW
 *         - RESOLVED
 *         - REJECTED
 *     - name: targetType
 *       in: query
 *       required: false
 *       description: Filter by targetType.
 *       schema:
 *         type: string
 *         enum:
 *         - DOCUMENTARY_ITEM
 *         - MESSAGE
 *         - USER
 *         - MISSING_PERSON_REPORT
 *     - name: reason
 *       in: query
 *       required: false
 *       description: Filter by reason.
 *       schema:
 *         type: string
 *         enum:
 *         - FALSE_INFORMATION
 *         - ABUSE
 *         - HARASSMENT
 *         - PRIVACY_VIOLATION
 *         - DUPLICATE
 *         - GRAPHIC_CONTENT
 *         - OTHER
 * /governance/moderation-reports/{reportId}/status:
 *   patch:
 *     tags:
 *     - Moderation
 *     summary: Update a moderation report status
 *     operationId: patch_governance_moderation_reports_reportId_status
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Update a moderation report status successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '422':
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     x-required-role: ADMIN
 *     description: Requires an active ADMIN account.
 *     parameters:
 *     - name: reportId
 *       in: path
 *       required: true
 *       description: reportId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ModerationStatusRequest'
 * /governance/admin/notes:
 *   get:
 *     tags:
 *     - Administration
 *     summary: List private admin notes
 *     operationId: get_governance_admin_notes
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: List private admin notes successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     x-required-role: ADMIN
 *     description: Requires an active ADMIN account.
 *     parameters:
 *     - name: targetType
 *       in: query
 *       required: false
 *       description: Filter by targetType.
 *       schema:
 *         type: string
 *         enum:
 *         - SUPPORT_CASE
 *         - DOCUMENTARY_SUBMISSION
 *         - DOCUMENTARY_ITEM
 *         - MISSING_PERSON_REPORT
 *         - MISSING_PERSON_SIGHTING
 *     - name: targetId
 *       in: query
 *       required: false
 *       description: Filter by targetId.
 *       schema:
 *         type: string
 *     - name: adminId
 *       in: query
 *       required: false
 *       description: Filter by adminId.
 *       schema:
 *         type: string
 *   post:
 *     tags:
 *     - Administration
 *     summary: Create a private admin note
 *     operationId: post_governance_admin_notes
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '201':
 *         description: Create a private admin note successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '422':
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     x-required-role: ADMIN
 *     description: Requires an active ADMIN account.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminNoteRequest'
 * /governance/admin/notes/{noteId}:
 *   patch:
 *     tags:
 *     - Administration
 *     summary: Update a private admin note
 *     operationId: patch_governance_admin_notes_noteId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Update a private admin note successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '422':
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     x-required-role: ADMIN
 *     description: Requires an active ADMIN account.
 *     parameters:
 *     - name: noteId
 *       in: path
 *       required: true
 *       description: noteId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminNoteUpdateRequest'
 *   delete:
 *     tags:
 *     - Administration
 *     summary: Delete a private admin note
 *     operationId: delete_governance_admin_notes_noteId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Delete a private admin note successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     x-required-role: ADMIN
 *     description: Requires an active ADMIN account.
 *     parameters:
 *     - name: noteId
 *       in: path
 *       required: true
 *       description: noteId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 * /governance/admin/audit-logs:
 *   get:
 *     tags:
 *     - Administration
 *     summary: List audit log records
 *     operationId: get_governance_admin_audit_logs
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: List audit log records successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedSuccessResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     x-required-role: ADMIN
 *     description: Requires an active ADMIN account.
 *     parameters:
 *     - $ref: '#/components/parameters/PageParam'
 *     - $ref: '#/components/parameters/LimitParam'
 *     - name: actorId
 *       in: query
 *       required: false
 *       description: Filter by actorId.
 *       schema:
 *         type: string
 *     - name: action
 *       in: query
 *       required: false
 *       description: Filter by action.
 *       schema:
 *         type: string
 *     - name: targetType
 *       in: query
 *       required: false
 *       description: Filter by targetType.
 *       schema:
 *         type: string
 *     - name: targetId
 *       in: query
 *       required: false
 *       description: Filter by targetId.
 *       schema:
 *         type: string
 *     - name: includeChanges
 *       in: query
 *       required: false
 *       description: Filter by includeChanges.
 *       schema:
 *         type: boolean
 * /governance/admin/settings:
 *   get:
 *     tags:
 *     - Administration
 *     summary: List site settings
 *     operationId: get_governance_admin_settings
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: List site settings successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     x-required-role: ADMIN
 *     description: Requires an active ADMIN account.
 * /governance/admin/settings/{key}:
 *   get:
 *     tags:
 *     - Administration
 *     summary: Get one site setting
 *     operationId: get_governance_admin_settings_key
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Get one site setting successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     x-required-role: ADMIN
 *     description: Requires an active ADMIN account.
 *     parameters:
 *     - name: key
 *       in: path
 *       required: true
 *       description: key path parameter.
 *       schema:
 *         type: string
 *         example: archiveSubmissionEnabled
 *   put:
 *     tags:
 *     - Administration
 *     summary: Create or update a site setting
 *     operationId: put_governance_admin_settings_key
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Create or update a site setting successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '422':
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     x-required-role: ADMIN
 *     description: Requires an active ADMIN account.
 *     parameters:
 *     - name: key
 *       in: path
 *       required: true
 *       description: key path parameter.
 *       schema:
 *         type: string
 *         example: archiveSubmissionEnabled
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SiteSettingRequest'
 *   delete:
 *     tags:
 *     - Administration
 *     summary: Delete a site setting
 *     operationId: delete_governance_admin_settings_key
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Delete a site setting successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     x-required-role: ADMIN
 *     description: Requires an active ADMIN account.
 *     parameters:
 *     - name: key
 *       in: path
 *       required: true
 *       description: key path parameter.
 *       schema:
 *         type: string
 *         example: archiveSubmissionEnabled
 */

const router = express.Router();
router.use(authenticate);
router.get("/consents/mine", consent.listMine);
router.post("/consents", consent.grant);
router.post("/consents/:consentId/withdraw", validateObjectId("consentId"), consent.withdraw);
router.post("/moderation-reports", moderation.create);
router.get("/moderation-reports/mine", moderation.listMine);
router.get("/moderation-reports/admin", authorize("ADMIN"), moderation.listAdmin);
router.patch("/moderation-reports/:reportId/status", authorize("ADMIN"), validateObjectId("reportId"), moderation.updateStatus);

router.get("/admin/notes", authorize("ADMIN"), admin.listNotes);
router.post("/admin/notes", authorize("ADMIN"), admin.createNote);
router.patch("/admin/notes/:noteId", authorize("ADMIN"), validateObjectId("noteId"), admin.updateNote);
router.delete("/admin/notes/:noteId", authorize("ADMIN"), validateObjectId("noteId"), admin.deleteNote);
router.get("/admin/audit-logs", authorize("ADMIN"), admin.listAuditLogs);
router.get("/admin/settings", authorize("ADMIN"), admin.listSettings);
router.get("/admin/settings/:key", authorize("ADMIN"), admin.getSetting);
router.put("/admin/settings/:key", authorize("ADMIN"), admin.upsertSetting);
router.delete("/admin/settings/:key", authorize("ADMIN"), admin.deleteSetting);
module.exports = router;
