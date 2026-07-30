const express = require("express");
const publicController = require("../controllers/publicController");
/**
 * @openapi
 * /public/stats:
 *   get:
 *     tags:
 *     - Public
 *     summary: Get live transparency statistics
 *     operationId: get_public_stats
 *     security: []
 *     responses:
 *       '200':
 *         description: Get live transparency statistics successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 * /public/settings:
 *   get:
 *     tags:
 *     - Public
 *     summary: Get public site settings
 *     operationId: get_public_settings
 *     security: []
 *     responses:
 *       '200':
 *         description: Get public site settings successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 * /public/july-sathi:
 *   get:
 *     tags:
 *     - Public
 *     summary: Get deterministic July Sathi guidance
 *     operationId: get_public_july_sathi
 *     security: []
 *     responses:
 *       '200':
 *         description: Get deterministic July Sathi guidance successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     parameters:
 *     - name: action
 *       in: query
 *       required: false
 *       description: Filter by action.
 *       schema:
 *         type: string
 *         enum:
 *         - WELCOME
 *         - SHARE_TESTIMONY
 *         - INJURY_SUPPORT
 *         - EXPLORE_ARCHIVE
 *         - VERIFICATION
 *         - OFFLINE_QUEUE
 *         - EMERGENCY_INFORMATION
 */

const router = express.Router();
router.get("/stats", publicController.transparencyStats);
router.get("/settings", publicController.publicSettings);
router.get("/july-sathi", publicController.julySathiActions);
module.exports = router;
