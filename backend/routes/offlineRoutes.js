const express = require("express");
const submissions = require("../controllers/documentarySubmissionController");
const support = require("../controllers/supportController");
const { authenticate } = require("../middleware/auth");

/**
 * @openapi
 * /offline/sync/testimony:
 *   post:
 *     tags:
 *     - Offline Sync
 *     summary: Synchronize one queued testimony draft
 *     operationId: post_offline_sync_testimony
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '201':
 *         description: Synchronize one queued testimony draft successfully.
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
 *     description: Keep clientDraftId stable across retries to prevent duplicate records.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DocumentarySubmissionWriteRequest'
 * /offline/sync/support-request:
 *   post:
 *     tags:
 *     - Offline Sync
 *     summary: Synchronize one queued support-request draft
 *     operationId: post_offline_sync_support_request
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '201':
 *         description: Synchronize one queued support-request draft successfully.
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
 *     description: Keep clientDraftId stable across retries to prevent duplicate records.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SupportCaseCreateRequest'
 */

const router = express.Router();
router.use(authenticate);

// The frontend should sync one queued draft at a time and keep clientDraftId stable across retries.
router.post("/sync/testimony", submissions.create);
router.post("/sync/support-request", support.create);

module.exports = router;
