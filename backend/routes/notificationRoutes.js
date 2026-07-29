const express = require("express");
const notifications = require("../controllers/notificationController");
const { authenticate } = require("../middleware/auth");
const validateObjectId = require("../middleware/validateObjectId");

/**
 * @openapi
 * /notifications:
 *   get:
 *     tags:
 *     - Notifications
 *     summary: List current-user notifications
 *     operationId: get_notifications
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: List current-user notifications successfully.
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
 *     - name: unread
 *       in: query
 *       required: false
 *       description: Filter by unread.
 *       schema:
 *         type: boolean
 *     - name: type
 *       in: query
 *       required: false
 *       description: Filter by type.
 *       schema:
 *         type: string
 *         enum:
 *         - NEW_MESSAGE
 *         - STATUS_CHANGED
 *         - DOCUMENT_REQUESTED
 *         - SUBMISSION_APPROVED
 *         - SUBMISSION_REJECTED
 *         - MISSING_PERSON_UPDATE
 *         - SUPPORT_UPDATE
 * /notifications/read-all:
 *   patch:
 *     tags:
 *     - Notifications
 *     summary: Mark all current-user notifications as read
 *     operationId: patch_notifications_read_all
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Mark all current-user notifications as read successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 * /notifications/{notificationId}/read:
 *   patch:
 *     tags:
 *     - Notifications
 *     summary: Mark one notification as read
 *     operationId: patch_notifications_notificationId_read
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Mark one notification as read successfully.
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
 *     - name: notificationId
 *       in: path
 *       required: true
 *       description: notificationId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 * /notifications/{notificationId}:
 *   delete:
 *     tags:
 *     - Notifications
 *     summary: Delete one notification
 *     operationId: delete_notifications_notificationId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Delete one notification successfully.
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
 *     - name: notificationId
 *       in: path
 *       required: true
 *       description: notificationId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 */

const router = express.Router();
router.use(authenticate);
router.get("/", notifications.list);
router.patch("/read-all", notifications.markAllRead);
router.patch("/:notificationId/read", validateObjectId("notificationId"), notifications.markRead);
router.delete("/:notificationId", validateObjectId("notificationId"), notifications.remove);
module.exports = router;
