const express = require("express");
const verification = require("../controllers/verificationController");
const { authenticate } = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const validateObjectId = require("../middleware/validateObjectId");

/**
 * @openapi
 * /verifications/public/{targetType}/{targetId}:
 *   get:
 *     tags:
 *     - Verification
 *     summary: Get public verification details for a published target
 *     operationId: get_verifications_public_targetType_targetId
 *     security: []
 *     responses:
 *       '200':
 *         description: Get public verification details for a published target successfully.
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
 *     - name: targetType
 *       in: path
 *       required: true
 *       description: targetType path parameter.
 *       schema:
 *         type: string
 *         enum:
 *         - DOCUMENTARY_SUBMISSION
 *         - SUPPORT_CASE
 *         - MISSING_PERSON_REPORT
 *         - MISSING_PERSON_SIGHTING
 *         - MEDIA_ASSET
 *         - JULY_EVENT
 *     - name: targetId
 *       in: path
 *       required: true
 *       description: targetId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 * /verifications:
 *   post:
 *     tags:
 *     - Verification
 *     summary: Create a verification review
 *     operationId: post_verifications
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '201':
 *         description: Create a verification review successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerificationCreateRequest'
 *   get:
 *     tags:
 *     - Verification
 *     summary: List verification reviews
 *     operationId: get_verifications
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: List verification reviews successfully.
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
 *         - MISSING_PERSON_SIGHTING
 *         - MEDIA_ASSET
 *         - JULY_EVENT
 *     - name: targetId
 *       in: query
 *       required: false
 *       description: Filter by targetId.
 *       schema:
 *         type: string
 *     - name: reviewedBy
 *       in: query
 *       required: false
 *       description: Filter by reviewedBy.
 *       schema:
 *         type: string
 *     - name: status
 *       in: query
 *       required: false
 *       description: Filter by status.
 *       schema:
 *         type: string
 *         enum:
 *         - PENDING
 *         - IN_PROGRESS
 *         - NEEDS_INFORMATION
 *         - VERIFIED
 *         - REJECTED
 * /verifications/{reviewId}:
 *   get:
 *     tags:
 *     - Verification
 *     summary: Get one verification review
 *     operationId: get_verifications_reviewId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Get one verification review successfully.
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
 *     - name: reviewId
 *       in: path
 *       required: true
 *       description: reviewId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *   patch:
 *     tags:
 *     - Verification
 *     summary: Update an active verification review
 *     operationId: patch_verifications_reviewId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Update an active verification review successfully.
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
 *     - name: reviewId
 *       in: path
 *       required: true
 *       description: reviewId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerificationUpdateRequest'
 * /verifications/{reviewId}/finalize:
 *   post:
 *     tags:
 *     - Verification
 *     summary: Finalize a verification review
 *     operationId: post_verifications_reviewId_finalize
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Finalize a verification review successfully.
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
 *     - name: reviewId
 *       in: path
 *       required: true
 *       description: reviewId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerificationFinalizeRequest'
 */

const router = express.Router();
router.get("/public/:targetType/:targetId", validateObjectId("targetId"), verification.getPublicForTarget);
router.use(authenticate, authorize("ADMIN"));
router.post("/", verification.create);
router.get("/", verification.list);
router.get("/:reviewId", validateObjectId("reviewId"), verification.getById);
router.patch("/:reviewId", validateObjectId("reviewId"), verification.update);
router.post("/:reviewId/finalize", validateObjectId("reviewId"), verification.finalize);
module.exports = router;
