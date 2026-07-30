const express = require("express");
const tags = require("../controllers/tagController");
const locations = require("../controllers/locationController");
const { authenticate } = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const validateObjectId = require("../middleware/validateObjectId");

/**
 * @openapi
 * /taxonomy/tags:
 *   get:
 *     tags:
 *     - Tags
 *     summary: List archive tags
 *     operationId: get_taxonomy_tags
 *     security: []
 *     responses:
 *       '200':
 *         description: List archive tags successfully.
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
 *   post:
 *     tags:
 *     - Tags
 *     summary: Create an archive tag
 *     operationId: post_taxonomy_tags
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '201':
 *         description: Create an archive tag successfully.
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
 *             $ref: '#/components/schemas/TagWriteRequest'
 * /taxonomy/tags/{id}:
 *   get:
 *     tags:
 *     - Tags
 *     summary: Get one archive tag
 *     operationId: get_taxonomy_tags_id
 *     security: []
 *     responses:
 *       '200':
 *         description: Get one archive tag successfully.
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
 *     - name: id
 *       in: path
 *       required: true
 *       description: id path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *   patch:
 *     tags:
 *     - Tags
 *     summary: Update an archive tag
 *     operationId: patch_taxonomy_tags_id
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Update an archive tag successfully.
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
 *     - name: id
 *       in: path
 *       required: true
 *       description: id path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TagWriteRequest'
 *   delete:
 *     tags:
 *     - Tags
 *     summary: Delete an unused archive tag
 *     operationId: delete_taxonomy_tags_id
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Delete an unused archive tag successfully.
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
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     x-required-role: ADMIN
 *     description: Requires an active ADMIN account.
 *     parameters:
 *     - name: id
 *       in: path
 *       required: true
 *       description: id path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 * /taxonomy/locations/nearby:
 *   get:
 *     tags:
 *     - Locations
 *     summary: Find nearby locations
 *     operationId: get_taxonomy_locations_nearby
 *     security: []
 *     responses:
 *       '200':
 *         description: Find nearby locations successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '422':
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     parameters:
 *     - name: longitude
 *       in: query
 *       required: true
 *       description: Longitude.
 *       schema:
 *         type: number
 *         minimum: -180
 *         maximum: 180
 *     - name: latitude
 *       in: query
 *       required: true
 *       description: Latitude.
 *       schema:
 *         type: number
 *         minimum: -90
 *         maximum: 90
 *     - name: maxDistance
 *       in: query
 *       required: false
 *       description: Maximum distance in metres.
 *       schema:
 *         type: integer
 *         default: 20000
 *         minimum: 100
 *         maximum: 200000
 * /taxonomy/locations:
 *   get:
 *     tags:
 *     - Locations
 *     summary: List locations
 *     operationId: get_taxonomy_locations
 *     security: []
 *     responses:
 *       '200':
 *         description: List locations successfully.
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
 *     - name: type
 *       in: query
 *       required: false
 *       description: Filter by type.
 *       schema:
 *         type: string
 *         enum:
 *         - COUNTRY
 *         - DIVISION
 *         - DISTRICT
 *         - UPAZILA
 *         - CITY
 *         - AREA
 *         - LANDMARK
 *     - name: parentLocationId
 *       in: query
 *       required: false
 *       description: Filter by parentLocationId.
 *       schema:
 *         type: string
 *   post:
 *     tags:
 *     - Locations
 *     summary: Create a location
 *     operationId: post_taxonomy_locations
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '201':
 *         description: Create a location successfully.
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
 *             $ref: '#/components/schemas/LocationWriteRequest'
 * /taxonomy/locations/{id}:
 *   get:
 *     tags:
 *     - Locations
 *     summary: Get one location
 *     operationId: get_taxonomy_locations_id
 *     security: []
 *     responses:
 *       '200':
 *         description: Get one location successfully.
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
 *     - name: id
 *       in: path
 *       required: true
 *       description: id path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *   patch:
 *     tags:
 *     - Locations
 *     summary: Update a location
 *     operationId: patch_taxonomy_locations_id
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Update a location successfully.
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
 *     - name: id
 *       in: path
 *       required: true
 *       description: id path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LocationWriteRequest'
 *   delete:
 *     tags:
 *     - Locations
 *     summary: Delete an unused location
 *     operationId: delete_taxonomy_locations_id
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Delete an unused location successfully.
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
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     x-required-role: ADMIN
 *     description: Requires an active ADMIN account.
 *     parameters:
 *     - name: id
 *       in: path
 *       required: true
 *       description: id path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 */

const router = express.Router();
router.get("/tags", tags.list);
router.get("/tags/:id", validateObjectId("id"), tags.getById);
router.post("/tags", authenticate, authorize("ADMIN"), tags.create);
router.patch("/tags/:id", authenticate, authorize("ADMIN"), validateObjectId("id"), tags.update);
router.delete("/tags/:id", authenticate, authorize("ADMIN"), validateObjectId("id"), tags.remove);

router.get("/locations/nearby", locations.nearby);
router.get("/locations", locations.list);
router.get("/locations/:id", validateObjectId("id"), locations.getById);
router.post("/locations", authenticate, authorize("ADMIN"), locations.create);
router.patch("/locations/:id", authenticate, authorize("ADMIN"), validateObjectId("id"), locations.update);
router.delete("/locations/:id", authenticate, authorize("ADMIN"), validateObjectId("id"), locations.remove);
module.exports = router;
