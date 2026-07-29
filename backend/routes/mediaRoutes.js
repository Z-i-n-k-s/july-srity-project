const express = require("express");
const media = require("../controllers/mediaController");
const upload = require("../middleware/upload");
const { authenticate } = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const validateObjectId = require("../middleware/validateObjectId");

/**
 * @openapi
 * /media:
 *   post:
 *     tags:
 *     - Media
 *     summary: Upload one file to Cloudinary
 *     operationId: post_media
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '201':
 *         description: Upload one file to Cloudinary successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '422':
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       '413':
 *         $ref: '#/components/responses/PayloadTooLarge'
 *       '415':
 *         $ref: '#/components/responses/UnsupportedMediaType'
 *       '502':
 *         $ref: '#/components/responses/BadGateway'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/MediaUploadRequest'
 * /media/mine:
 *   get:
 *     tags:
 *     - Media
 *     summary: List the current user's media
 *     operationId: get_media_mine
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: List the current user's media successfully.
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
 *     - name: fileType
 *       in: query
 *       required: false
 *       description: Filter by fileType.
 *       schema:
 *         type: string
 *         enum:
 *         - IMAGE
 *         - VIDEO
 *         - AUDIO
 *         - PDF
 *         - DOCUMENT
 *     - name: uploadStatus
 *       in: query
 *       required: false
 *       description: Filter by uploadStatus.
 *       schema:
 *         type: string
 *         enum:
 *         - UPLOADING
 *         - PROCESSING
 *         - READY
 *         - FAILED
 * /media/admin:
 *   get:
 *     tags:
 *     - Media
 *     summary: List all media assets
 *     operationId: get_media_admin
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: List all media assets successfully.
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
 *     - name: fileType
 *       in: query
 *       required: false
 *       description: Filter by fileType.
 *       schema:
 *         type: string
 *         enum:
 *         - IMAGE
 *         - VIDEO
 *         - AUDIO
 *         - PDF
 *         - DOCUMENT
 *     - name: visibility
 *       in: query
 *       required: false
 *       description: Filter by visibility.
 *       schema:
 *         type: string
 *         enum:
 *         - PUBLIC
 *         - PRIVATE
 *         - ADMIN_ONLY
 *     - name: uploadStatus
 *       in: query
 *       required: false
 *       description: Filter by uploadStatus.
 *       schema:
 *         type: string
 *         enum:
 *         - UPLOADING
 *         - PROCESSING
 *         - READY
 *         - FAILED
 *     - name: moderationStatus
 *       in: query
 *       required: false
 *       description: Filter by moderationStatus.
 *       schema:
 *         type: string
 *         enum:
 *         - PENDING
 *         - APPROVED
 *         - REJECTED
 *     - name: sensitivityLevel
 *       in: query
 *       required: false
 *       description: Filter by sensitivityLevel.
 *       schema:
 *         type: string
 *         enum:
 *         - NONE
 *         - SENSITIVE
 *         - GRAPHIC
 *     - name: uploadedBy
 *       in: query
 *       required: false
 *       description: Filter by uploadedBy.
 *       schema:
 *         type: string
 * /media/{mediaId}:
 *   get:
 *     tags:
 *     - Media
 *     summary: Get media metadata
 *     operationId: get_media_mediaId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Get media metadata successfully.
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
 *     - name: mediaId
 *       in: path
 *       required: true
 *       description: mediaId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *   patch:
 *     tags:
 *     - Media
 *     summary: Update media visibility or moderation metadata
 *     operationId: patch_media_mediaId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Update media visibility or moderation metadata successfully.
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
 *     - name: mediaId
 *       in: path
 *       required: true
 *       description: mediaId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MediaUpdateRequest'
 *   delete:
 *     tags:
 *     - Media
 *     summary: Delete a media asset
 *     operationId: delete_media_mediaId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Delete a media asset successfully.
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
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     parameters:
 *     - name: mediaId
 *       in: path
 *       required: true
 *       description: mediaId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 */

const router = express.Router();
router.use(authenticate);
router.post("/", upload.single("file"), media.uploadMedia);
router.get("/mine", media.listMyMedia);
router.get("/admin", authorize("ADMIN"), media.listAllMedia);
router.get("/:mediaId", validateObjectId("mediaId"), media.getMedia);
router.patch("/:mediaId", validateObjectId("mediaId"), media.updateMedia);
router.delete("/:mediaId", validateObjectId("mediaId"), media.deleteMedia);
module.exports = router;
