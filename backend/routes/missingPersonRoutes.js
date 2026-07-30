const express = require("express");
const missing = require("../controllers/missingPersonController");
const { authenticate, optionalAuthenticate } = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const validateObjectId = require("../middleware/validateObjectId");

/**
 * @openapi
 * /missing-persons:
 *   get:
 *     tags:
 *     - Missing Persons
 *     summary: List verified public missing-person reports
 *     operationId: get_missing_persons
 *     security: []
 *     responses:
 *       '200':
 *         description: List verified public missing-person reports successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedSuccessResponse'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     parameters:
 *     - $ref: '#/components/parameters/PageParam'
 *     - $ref: '#/components/parameters/LimitParam'
 *     - $ref: '#/components/parameters/SearchParam'
 *     - name: locationId
 *       in: query
 *       required: false
 *       description: Filter by locationId.
 *       schema:
 *         type: string
 *     - name: gender
 *       in: query
 *       required: false
 *       description: Filter by gender.
 *       schema:
 *         type: string
 *   post:
 *     tags:
 *     - Missing Persons
 *     summary: Create a missing-person report
 *     operationId: post_missing_persons
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '201':
 *         description: Create a missing-person report successfully.
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
 *             $ref: '#/components/schemas/MissingPersonCreateRequest'
 * /missing-persons/public/{reportId}:
 *   get:
 *     tags:
 *     - Missing Persons
 *     summary: Get one verified public missing-person report
 *     operationId: get_missing_persons_public_reportId
 *     security: []
 *     responses:
 *       '200':
 *         description: Get one verified public missing-person report successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     parameters:
 *     - name: reportId
 *       in: path
 *       required: true
 *       description: reportId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 * /missing-persons/{reportId}/sightings:
 *   post:
 *     tags:
 *     - Missing Persons
 *     summary: Submit a private missing-person sighting
 *     operationId: post_missing_persons_reportId_sightings
 *     security: []
 *     responses:
 *       '201':
 *         description: Submit a private missing-person sighting successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '422':
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     description: Authentication is optional. The sighting remains private until reviewed.
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
 *             $ref: '#/components/schemas/SightingCreateRequest'
 * /missing-persons/mine:
 *   get:
 *     tags:
 *     - Missing Persons
 *     summary: List the current user's missing-person reports
 *     operationId: get_missing_persons_mine
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: List the current user's missing-person reports successfully.
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
 *         - DRAFT
 *         - PENDING_REVIEW
 *         - NEEDS_INFORMATION
 *         - VERIFIED_MISSING
 *         - FOUND_ALIVE
 *         - FOUND_DECEASED
 *         - FALSE_REPORT
 *         - CLOSED
 * /missing-persons/admin:
 *   get:
 *     tags:
 *     - Missing Persons
 *     summary: List all missing-person reports
 *     operationId: get_missing_persons_admin
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: List all missing-person reports successfully.
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
 *         - DRAFT
 *         - PENDING_REVIEW
 *         - NEEDS_INFORMATION
 *         - VERIFIED_MISSING
 *         - FOUND_ALIVE
 *         - FOUND_DECEASED
 *         - FALSE_REPORT
 *         - CLOSED
 *     - name: adminId
 *       in: query
 *       required: false
 *       description: Filter by adminId.
 *       schema:
 *         type: string
 *     - name: reportedBy
 *       in: query
 *       required: false
 *       description: Filter by reportedBy.
 *       schema:
 *         type: string
 * /missing-persons/{reportId}:
 *   get:
 *     tags:
 *     - Missing Persons
 *     summary: Get one missing-person report with permitted private information
 *     operationId: get_missing_persons_reportId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Get one missing-person report with permitted private information successfully.
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
 *     - name: reportId
 *       in: path
 *       required: true
 *       description: reportId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *   patch:
 *     tags:
 *     - Missing Persons
 *     summary: Update an editable missing-person report
 *     operationId: patch_missing_persons_reportId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Update an editable missing-person report successfully.
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
 *             $ref: '#/components/schemas/MissingPersonUpdateRequest'
 *   delete:
 *     tags:
 *     - Missing Persons
 *     summary: Delete an allowed missing-person report
 *     operationId: delete_missing_persons_reportId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Delete an allowed missing-person report successfully.
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
 *     - name: reportId
 *       in: path
 *       required: true
 *       description: reportId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 * /missing-persons/{reportId}/submit:
 *   post:
 *     tags:
 *     - Missing Persons
 *     summary: Submit a missing-person report for review
 *     operationId: post_missing_persons_reportId_submit
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '201':
 *         description: Submit a missing-person report for review successfully.
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
 *     - name: reportId
 *       in: path
 *       required: true
 *       description: reportId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 * /missing-persons/{reportId}/assign:
 *   patch:
 *     tags:
 *     - Missing Persons
 *     summary: Assign administrators to a missing-person report
 *     operationId: patch_missing_persons_reportId_assign
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Assign administrators to a missing-person report successfully.
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
 *             $ref: '#/components/schemas/AssignAdminsRequest'
 * /missing-persons/{reportId}/status:
 *   patch:
 *     tags:
 *     - Missing Persons
 *     summary: Change a missing-person report status
 *     operationId: patch_missing_persons_reportId_status
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Change a missing-person report status successfully.
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
 *       '409':
 *         $ref: '#/components/responses/Conflict'
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
 *             $ref: '#/components/schemas/MissingPersonStatusRequest'
 * /missing-persons/{reportId}/sightings/{sightingId}/status:
 *   patch:
 *     tags:
 *     - Missing Persons
 *     summary: Change a sighting review status
 *     operationId: patch_missing_persons_reportId_sightings_sightingId_status
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Change a sighting review status successfully.
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
 *     - name: sightingId
 *       in: path
 *       required: true
 *       description: sightingId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SightingStatusRequest'
 */

const router = express.Router();
router.get("/", missing.listPublic);
router.get(
  "/public/:reportId",
  missing.getPublic
);
router.post("/:reportId/sightings", optionalAuthenticate, validateObjectId("reportId"), missing.createSighting);

router.use(authenticate);
router.post("/", missing.create);
router.get("/mine", missing.listMine);
router.get("/admin", authorize("ADMIN"), missing.listAdmin);
router.get("/:reportId", validateObjectId("reportId"), missing.getPrivate);
router.patch("/:reportId", validateObjectId("reportId"), missing.update);
router.post("/:reportId/submit", validateObjectId("reportId"), missing.submitForReview);
router.patch("/:reportId/assign", authorize("ADMIN"), validateObjectId("reportId"), missing.assignAdmins);
router.patch("/:reportId/status", authorize("ADMIN"), validateObjectId("reportId"), missing.changeStatus);
router.patch("/:reportId/sightings/:sightingId/status", authorize("ADMIN"), validateObjectId("reportId", "sightingId"), missing.changeSightingStatus);
router.delete("/:reportId", validateObjectId("reportId"), missing.remove);
module.exports = router;
