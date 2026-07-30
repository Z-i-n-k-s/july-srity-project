const express = require("express");
const submissions = require("../controllers/documentarySubmissionController");
const { authenticate } = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const validateObjectId = require("../middleware/validateObjectId");

/**
 * @openapi
 * /submissions:
 *   post:
 *     tags:
 *     - Documentary Submissions
 *     summary: Create a testimony or documentary submission
 *     operationId: post_submissions
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '201':
 *         description: Create a testimony or documentary submission successfully.
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
 *             $ref: '#/components/schemas/DocumentarySubmissionWriteRequest'
 * /submissions/mine:
 *   get:
 *     tags:
 *     - Documentary Submissions
 *     summary: List the current user's submissions
 *     operationId: get_submissions_mine
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: List the current user's submissions successfully.
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
 *         - SUBMITTED
 *         - UNDER_REVIEW
 *         - NEEDS_INFORMATION
 *         - VERIFIED
 *         - REJECTED
 *         - PUBLISHED
 *         - ARCHIVED
 *     - name: submissionType
 *       in: query
 *       required: false
 *       description: Filter by submissionType.
 *       schema:
 *         type: string
 *         enum:
 *         - STORY
 *         - IMAGE
 *         - VIDEO
 *         - AUDIO
 *         - DOCUMENT
 *         - TESTIMONY
 *         - CORRECTION
 * /submissions/admin:
 *   get:
 *     tags:
 *     - Documentary Submissions
 *     summary: List all documentary submissions
 *     operationId: get_submissions_admin
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: List all documentary submissions successfully.
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
 *         - SUBMITTED
 *         - UNDER_REVIEW
 *         - NEEDS_INFORMATION
 *         - VERIFIED
 *         - REJECTED
 *         - PUBLISHED
 *         - ARCHIVED
 *     - name: submissionType
 *       in: query
 *       required: false
 *       description: Filter by submissionType.
 *       schema:
 *         type: string
 *         enum:
 *         - STORY
 *         - IMAGE
 *         - VIDEO
 *         - AUDIO
 *         - DOCUMENT
 *         - TESTIMONY
 *         - CORRECTION
 *     - name: sourceType
 *       in: query
 *       required: false
 *       description: Filter by sourceType.
 *       schema:
 *         type: string
 *         enum:
 *         - FIRST_HAND
 *         - WITNESS
 *         - FAMILY_MEMBER
 *         - NEWS_SOURCE
 *         - SOCIAL_MEDIA
 *         - UNKNOWN
 *     - name: assignedAdminId
 *       in: query
 *       required: false
 *       description: Filter by assignedAdminId.
 *       schema:
 *         type: string
 *     - name: submittedBy
 *       in: query
 *       required: false
 *       description: Filter by submittedBy.
 *       schema:
 *         type: string
 * /submissions/{submissionId}:
 *   get:
 *     tags:
 *     - Documentary Submissions
 *     summary: Get one documentary submission
 *     operationId: get_submissions_submissionId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Get one documentary submission successfully.
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
 *     - name: submissionId
 *       in: path
 *       required: true
 *       description: submissionId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *   patch:
 *     tags:
 *     - Documentary Submissions
 *     summary: Update an editable documentary submission
 *     operationId: patch_submissions_submissionId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Update an editable documentary submission successfully.
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
 *       '409':
 *         $ref: '#/components/responses/Conflict'
 *       '422':
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     parameters:
 *     - name: submissionId
 *       in: path
 *       required: true
 *       description: submissionId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DocumentarySubmissionWriteRequest'
 *   delete:
 *     tags:
 *     - Documentary Submissions
 *     summary: Delete an allowed documentary submission
 *     operationId: delete_submissions_submissionId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Delete an allowed documentary submission successfully.
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
 *     - name: submissionId
 *       in: path
 *       required: true
 *       description: submissionId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 * /submissions/{submissionId}/submit:
 *   post:
 *     tags:
 *     - Documentary Submissions
 *     summary: Submit a draft for administrator review
 *     operationId: post_submissions_submissionId_submit
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Submit a draft for administrator review successfully.
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
 *     - name: submissionId
 *       in: path
 *       required: true
 *       description: submissionId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 * /submissions/{submissionId}/assign:
 *   patch:
 *     tags:
 *     - Documentary Submissions
 *     summary: Assign an administrator to a submission
 *     operationId: patch_submissions_submissionId_assign
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Assign an administrator to a submission successfully.
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
 *     - name: submissionId
 *       in: path
 *       required: true
 *       description: submissionId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignAdminRequest'
 * /submissions/{submissionId}/status:
 *   patch:
 *     tags:
 *     - Documentary Submissions
 *     summary: Change a documentary submission status
 *     operationId: patch_submissions_submissionId_status
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Change a documentary submission status successfully.
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
 *     - name: submissionId
 *       in: path
 *       required: true
 *       description: submissionId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubmissionStatusRequest'
 */

const router = express.Router();
router.use(authenticate);
router.post("/", submissions.create);
router.get("/mine", submissions.listMine);
router.get("/admin", authorize("ADMIN"), submissions.listAdmin);
router.get("/:submissionId", validateObjectId("submissionId"), submissions.getById);
router.patch("/:submissionId", validateObjectId("submissionId"), submissions.update);
router.post("/:submissionId/submit", validateObjectId("submissionId"), submissions.submitForReview);
router.patch("/:submissionId/assign", authorize("ADMIN"), validateObjectId("submissionId"), submissions.assignAdmin);
router.patch("/:submissionId/status", authorize("ADMIN"), validateObjectId("submissionId"), submissions.changeStatus);
router.delete("/:submissionId", validateObjectId("submissionId"), submissions.remove);
module.exports = router;
