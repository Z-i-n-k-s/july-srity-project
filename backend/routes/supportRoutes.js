const express = require("express");
const support = require("../controllers/supportController");
const { authenticate } = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const validateObjectId = require("../middleware/validateObjectId");

/**
 * @openapi
 * /support-cases:
 *   post:
 *     tags:
 *     - Support Cases
 *     summary: Create an injured-person support request
 *     operationId: post_support_cases
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '201':
 *         description: Create an injured-person support request successfully.
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
 *             $ref: '#/components/schemas/SupportCaseCreateRequest'
 * /support-cases/mine:
 *   get:
 *     tags:
 *     - Support Cases
 *     summary: List the current user's support requests
 *     operationId: get_support_cases_mine
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: List the current user's support requests successfully.
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
 *     - name: status
 *       in: query
 *       required: false
 *       description: Filter by status.
 *       schema:
 *         type: string
 *         enum:
 *         - NEW
 *         - UNDER_REVIEW
 *         - ACTION_REQUIRED
 *         - VERIFICATION_PENDING
 *         - VERIFIED
 *         - SUPPORT_IN_PROGRESS
 *         - RESOLVED
 *         - REJECTED
 *         - CLOSED
 * /support-cases/admin:
 *   get:
 *     tags:
 *     - Support Cases
 *     summary: List all support cases
 *     operationId: get_support_cases_admin
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: List all support cases successfully.
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
 *     - $ref: '#/components/parameters/SearchParam'
 *     - name: status
 *       in: query
 *       required: false
 *       description: Filter by status.
 *       schema:
 *         type: string
 *         enum:
 *         - NEW
 *         - UNDER_REVIEW
 *         - ACTION_REQUIRED
 *         - VERIFICATION_PENDING
 *         - VERIFIED
 *         - SUPPORT_IN_PROGRESS
 *         - RESOLVED
 *         - REJECTED
 *         - CLOSED
 *     - name: priority
 *       in: query
 *       required: false
 *       description: Filter by priority.
 *       schema:
 *         type: string
 *         enum:
 *         - LOW
 *         - NORMAL
 *         - HIGH
 *         - URGENT
 *         - CRITICAL
 *     - name: injuryLevel
 *       in: query
 *       required: false
 *       description: Filter by injuryLevel.
 *       schema:
 *         type: string
 *         enum:
 *         - STABLE
 *         - NEEDS_ATTENTION
 *         - URGENT
 *         - CRITICAL
 *     - name: createdBy
 *       in: query
 *       required: false
 *       description: Filter by createdBy.
 *       schema:
 *         type: string
 *     - name: districtId
 *       in: query
 *       required: false
 *       description: Filter by districtId.
 *       schema:
 *         type: string
 *     - name: adminId
 *       in: query
 *       required: false
 *       description: Filter by adminId.
 *       schema:
 *         type: string
 *     - name: supportType
 *       in: query
 *       required: false
 *       description: Filter by supportType.
 *       schema:
 *         type: string
 *         enum:
 *         - MEDICAL_TREATMENT
 *         - MEDICINE
 *         - REHABILITATION
 *         - LEGAL_SUPPORT
 *         - FINANCIAL
 *         - TRANSPORT
 *         - OTHER
 * /support-cases/{caseId}:
 *   get:
 *     tags:
 *     - Support Cases
 *     summary: Get one support case with permitted private details
 *     operationId: get_support_cases_caseId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Get one support case with permitted private details successfully.
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
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     parameters:
 *     - name: caseId
 *       in: path
 *       required: true
 *       description: caseId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *   patch:
 *     tags:
 *     - Support Cases
 *     summary: Update an editable support case
 *     operationId: patch_support_cases_caseId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Update an editable support case successfully.
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
 *     - name: caseId
 *       in: path
 *       required: true
 *       description: caseId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SupportCaseUpdateRequest'
 *   delete:
 *     tags:
 *     - Support Cases
 *     summary: Delete an allowed support case
 *     operationId: delete_support_cases_caseId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Delete an allowed support case successfully.
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
 *     - name: caseId
 *       in: path
 *       required: true
 *       description: caseId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 * /support-cases/{caseId}/assign:
 *   patch:
 *     tags:
 *     - Support Cases
 *     summary: Assign administrators to a support case
 *     operationId: patch_support_cases_caseId_assign
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Assign administrators to a support case successfully.
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
 *     - name: caseId
 *       in: path
 *       required: true
 *       description: caseId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignAdminsRequest'
 * /support-cases/{caseId}/status:
 *   patch:
 *     tags:
 *     - Support Cases
 *     summary: Change a support case status
 *     operationId: patch_support_cases_caseId_status
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Change a support case status successfully.
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
 *     - name: caseId
 *       in: path
 *       required: true
 *       description: caseId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SupportStatusRequest'
 * /support-cases/{caseId}/assistance:
 *   post:
 *     tags:
 *     - Support Cases
 *     summary: Create a support assistance record
 *     operationId: post_support_cases_caseId_assistance
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '201':
 *         description: Create a support assistance record successfully.
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
 *     - name: caseId
 *       in: path
 *       required: true
 *       description: caseId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssistanceRequest'
 * /support-cases/{caseId}/assistance/{assistanceId}:
 *   patch:
 *     tags:
 *     - Support Cases
 *     summary: Update a support assistance record
 *     operationId: patch_support_cases_caseId_assistance_assistanceId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Update a support assistance record successfully.
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
 *     - name: caseId
 *       in: path
 *       required: true
 *       description: caseId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     - name: assistanceId
 *       in: path
 *       required: true
 *       description: assistanceId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssistanceRequest'
 *   delete:
 *     tags:
 *     - Support Cases
 *     summary: Delete a support assistance record
 *     operationId: delete_support_cases_caseId_assistance_assistanceId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Delete a support assistance record successfully.
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
 *     - name: caseId
 *       in: path
 *       required: true
 *       description: caseId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     - name: assistanceId
 *       in: path
 *       required: true
 *       description: assistanceId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 */

const router = express.Router();
router.use(authenticate);
router.post("/", support.create);
router.get("/mine", support.listMine);
router.get("/admin", authorize("ADMIN"), support.listAdmin);
router.get("/:caseId", validateObjectId("caseId"), support.getById);
router.patch("/:caseId", validateObjectId("caseId"), support.update);
router.patch("/:caseId/assign", authorize("ADMIN"), validateObjectId("caseId"), support.assignAdmins);
router.patch("/:caseId/status", authorize("ADMIN"), validateObjectId("caseId"), support.changeStatus);
router.post("/:caseId/assistance", authorize("ADMIN"), validateObjectId("caseId"), support.createAssistance);
router.patch("/:caseId/assistance/:assistanceId", authorize("ADMIN"), validateObjectId("caseId", "assistanceId"), support.updateAssistance);
router.delete("/:caseId/assistance/:assistanceId", authorize("ADMIN"), validateObjectId("caseId", "assistanceId"), support.deleteAssistance);
router.delete("/:caseId", validateObjectId("caseId"), support.remove);
module.exports = router;
