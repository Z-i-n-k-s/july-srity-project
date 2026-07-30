const express = require("express");
const frontendCompatibilityRoutes = require("./frontendCompatibilityRoutes");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const mediaRoutes = require("./mediaRoutes");
const taxonomyRoutes = require("./taxonomyRoutes");
const archiveRoutes = require("./archiveRoutes");
const submissionRoutes = require("./submissionRoutes");
const verificationRoutes = require("./verificationRoutes");
const supportRoutes = require("./supportRoutes");
const missingPersonRoutes = require("./missingPersonRoutes");
const conversationRoutes = require("./conversationRoutes");
const notificationRoutes = require("./notificationRoutes");
const governanceRoutes = require("./governanceRoutes");
const publicRoutes = require("./publicRoutes");
const offlineRoutes = require("./offlineRoutes");
const auth = require("../controllers/authController");
const users = require("../controllers/userController");
const legacy = require("../controllers/legacyController");
const { authenticate } = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const { authLimiter } = require("../middleware/rateLimits");
const AppError = require("../helpers/AppError");

/**
 * @openapi
 * /signup:
 *   post:
 *     tags:
 *     - Legacy Compatibility
 *     summary: Legacy user registration endpoint
 *     operationId: legacy_post_signup
 *     security: []
 *     responses:
 *       '201':
 *         description: Legacy user registration endpoint successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '409':
 *         $ref: '#/components/responses/Conflict'
 *       '422':
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     description: Deprecated compatibility alias. Use POST /auth/signup for new frontend code.
 *     deprecated: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignUpRequest'
 * /signin:
 *   post:
 *     tags:
 *     - Legacy Compatibility
 *     summary: Legacy sign-in endpoint
 *     operationId: legacy_post_signin
 *     security: []
 *     responses:
 *       '200':
 *         description: Legacy sign-in endpoint successfully.
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
 *     description: Deprecated compatibility alias. Use POST /auth/signin for new frontend code.
 *     deprecated: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignInRequest'
 * /user-details:
 *   get:
 *     tags:
 *     - Legacy Compatibility
 *     summary: Legacy current-user profile endpoint
 *     operationId: legacy_get_user_details
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Legacy current-user profile endpoint successfully.
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
 *     description: Deprecated compatibility alias. Use GET /users/me for new frontend code.
 *     deprecated: true
 * /userLogout:
 *   get:
 *     tags:
 *     - Legacy Compatibility
 *     summary: Legacy logout endpoint using GET
 *     operationId: legacy_get_userLogout
 *     security: []
 *     responses:
 *       '200':
 *         description: Legacy logout endpoint using GET successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     description: Deprecated compatibility alias. Use POST /auth/logout for new frontend code.
 *     deprecated: true
 *   post:
 *     tags:
 *     - Legacy Compatibility
 *     summary: Legacy logout endpoint
 *     operationId: legacy_post_userLogout
 *     security: []
 *     responses:
 *       '200':
 *         description: Legacy logout endpoint successfully.
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
 *     description: Deprecated compatibility alias. Use POST /auth/logout for new frontend code.
 *     deprecated: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LogoutRequest'
 * /forgot-password:
 *   post:
 *     tags:
 *     - Legacy Compatibility
 *     summary: Legacy forgot-password endpoint
 *     operationId: legacy_post_forgot_password
 *     security: []
 *     responses:
 *       '200':
 *         description: Legacy forgot-password endpoint successfully.
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
 *     description: Deprecated compatibility alias. Use POST /auth/forgot-password for new frontend code.
 *     deprecated: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 * /reset-password:
 *   post:
 *     tags:
 *     - Legacy Compatibility
 *     summary: Legacy password-reset endpoint
 *     operationId: legacy_post_reset_password
 *     security: []
 *     responses:
 *       '200':
 *         description: Legacy password-reset endpoint successfully.
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
 *     description: Deprecated compatibility alias. Use POST /auth/reset-password for new frontend code.
 *     deprecated: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 * /verify-reset-token/{token}:
 *   get:
 *     tags:
 *     - Legacy Compatibility
 *     summary: Legacy password-reset-token verification endpoint
 *     operationId: legacy_get_verify_reset_token_token
 *     security: []
 *     responses:
 *       '200':
 *         description: Legacy password-reset-token verification endpoint successfully.
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
 *     description: Deprecated compatibility alias. Use GET /auth/verify-reset-token/{token} for new frontend code.
 *     deprecated: true
 *     parameters:
 *     - name: token
 *       in: path
 *       required: true
 *       description: token path parameter.
 *       schema:
 *         type: string
 *         example: password-reset-token
 * /all-user:
 *   get:
 *     tags:
 *     - Legacy Compatibility
 *     summary: Legacy list-users endpoint
 *     operationId: legacy_get_all_user
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Legacy list-users endpoint successfully.
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
 *     description: Deprecated compatibility alias. Use GET /users for new frontend code. Requires an active ADMIN account.
 *     x-required-role: ADMIN
 *     deprecated: true
 *     parameters:
 *     - $ref: '#/components/parameters/PageParam'
 *     - $ref: '#/components/parameters/LimitParam'
 *     - $ref: '#/components/parameters/SearchParam'
 * /user-search:
 *   post:
 *     tags:
 *     - Legacy Compatibility
 *     summary: Legacy user search by email
 *     operationId: legacy_post_user_search
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Legacy user search by email successfully.
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
 *     description: Deprecated compatibility alias. Use GET /users?q=<email> for new frontend code. Requires an active ADMIN account.
 *     x-required-role: ADMIN
 *     deprecated: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LegacyUserSearchRequest'
 * /update-profile:
 *   post:
 *     tags:
 *     - Legacy Compatibility
 *     summary: Legacy update-profile endpoint
 *     operationId: legacy_post_update_profile
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Legacy update-profile endpoint successfully.
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
 *     description: Deprecated compatibility alias. Use PATCH /users/me for new frontend code.
 *     deprecated: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 * /update-user:
 *   post:
 *     tags:
 *     - Legacy Compatibility
 *     summary: Legacy ADMIN update-user endpoint
 *     operationId: legacy_post_update_user
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Legacy ADMIN update-user endpoint successfully.
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
 *     description: Deprecated compatibility alias. Use PATCH /users/{userId} for new frontend code. Requires an active ADMIN account.
 *     x-required-role: ADMIN
 *     deprecated: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LegacyUpdateUserRequest'
 * /delete-user:
 *   post:
 *     tags:
 *     - Legacy Compatibility
 *     summary: Legacy ADMIN delete-user endpoint
 *     operationId: legacy_post_delete_user
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Legacy ADMIN delete-user endpoint successfully.
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
 *     description: Deprecated compatibility alias. Use DELETE /users/{userId} for new frontend code. Requires an active ADMIN account.
 *     x-required-role: ADMIN
 *     deprecated: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LegacyDeleteUserRequest'
 * /tags:
 *   get:
 *     tags:
 *     - Legacy Taxonomy
 *     summary: 'Legacy taxonomy alias: List archive tags'
 *     operationId: legacy_get_tags
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
 *     deprecated: true
 *     description: Deprecated root-level alias. Use GET /taxonomy/tags instead.
 *   post:
 *     tags:
 *     - Legacy Taxonomy
 *     summary: 'Legacy taxonomy alias: Create an archive tag'
 *     operationId: legacy_post_tags
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
 *     description: Deprecated root-level alias. Use POST /taxonomy/tags instead.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TagWriteRequest'
 *     deprecated: true
 * /tags/{id}:
 *   get:
 *     tags:
 *     - Legacy Taxonomy
 *     summary: 'Legacy taxonomy alias: Get one archive tag'
 *     operationId: legacy_get_tags_id
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
 *     deprecated: true
 *     description: Deprecated root-level alias. Use GET /taxonomy/tags/{id} instead.
 *   patch:
 *     tags:
 *     - Legacy Taxonomy
 *     summary: 'Legacy taxonomy alias: Update an archive tag'
 *     operationId: legacy_patch_tags_id
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
 *     description: Deprecated root-level alias. Use PATCH /taxonomy/tags/{id} instead.
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
 *     deprecated: true
 *   delete:
 *     tags:
 *     - Legacy Taxonomy
 *     summary: 'Legacy taxonomy alias: Delete an unused archive tag'
 *     operationId: legacy_delete_tags_id
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
 *     description: Deprecated root-level alias. Use DELETE /taxonomy/tags/{id} instead.
 *     parameters:
 *     - name: id
 *       in: path
 *       required: true
 *       description: id path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     deprecated: true
 * /locations/nearby:
 *   get:
 *     tags:
 *     - Legacy Taxonomy
 *     summary: 'Legacy taxonomy alias: Find nearby locations'
 *     operationId: legacy_get_locations_nearby
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
 *     deprecated: true
 *     description: Deprecated root-level alias. Use GET /taxonomy/locations/nearby instead.
 * /locations:
 *   get:
 *     tags:
 *     - Legacy Taxonomy
 *     summary: 'Legacy taxonomy alias: List locations'
 *     operationId: legacy_get_locations
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
 *     deprecated: true
 *     description: Deprecated root-level alias. Use GET /taxonomy/locations instead.
 *   post:
 *     tags:
 *     - Legacy Taxonomy
 *     summary: 'Legacy taxonomy alias: Create a location'
 *     operationId: legacy_post_locations
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
 *     description: Deprecated root-level alias. Use POST /taxonomy/locations instead.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LocationWriteRequest'
 *     deprecated: true
 * /locations/{id}:
 *   get:
 *     tags:
 *     - Legacy Taxonomy
 *     summary: 'Legacy taxonomy alias: Get one location'
 *     operationId: legacy_get_locations_id
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
 *     deprecated: true
 *     description: Deprecated root-level alias. Use GET /taxonomy/locations/{id} instead.
 *   patch:
 *     tags:
 *     - Legacy Taxonomy
 *     summary: 'Legacy taxonomy alias: Update a location'
 *     operationId: legacy_patch_locations_id
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
 *     description: Deprecated root-level alias. Use PATCH /taxonomy/locations/{id} instead.
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
 *     deprecated: true
 *   delete:
 *     tags:
 *     - Legacy Taxonomy
 *     summary: 'Legacy taxonomy alias: Delete an unused location'
 *     operationId: legacy_delete_locations_id
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
 *     description: Deprecated root-level alias. Use DELETE /taxonomy/locations/{id} instead.
 *     parameters:
 *     - name: id
 *       in: path
 *       required: true
 *       description: id path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     deprecated: true
 */

const router = express.Router();

router.use(frontendCompatibilityRoutes);

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/media", mediaRoutes);
router.use("/taxonomy", taxonomyRoutes);
router.use("/archive", archiveRoutes);
router.use("/submissions", submissionRoutes);
router.use("/verifications", verificationRoutes);
router.use("/support-cases", supportRoutes);
router.use("/missing-persons", missingPersonRoutes);
router.use("/conversations", conversationRoutes);
router.use("/notifications", notificationRoutes);
router.use("/governance", governanceRoutes);
router.use("/public", publicRoutes);
router.use("/offline", offlineRoutes);
router.use("/", taxonomyRoutes);

// Backward-compatible aliases for the existing frontend.
router.post("/signup", authLimiter, auth.signUp);
router.post("/signin", authLimiter, auth.signIn);
router.get("/user-details", authenticate, users.getMe);
router.get("/userLogout", auth.logout);
router.post("/userLogout", auth.logout);
router.post("/forgot-password", authLimiter, auth.forgotPassword);
router.post("/reset-password", authLimiter, auth.resetPassword);
router.get("/verify-reset-token/:token", authLimiter, auth.verifyResetToken);
router.get("/all-user", authenticate, authorize("ADMIN"), legacy.listAllUsersForFrontend);
router.post("/user-search", authenticate, authorize("ADMIN"), legacy.searchUserByEmail);
router.post("/update-profile", authenticate, users.updateMe);
router.post(
  "/update-user",
  authenticate,
  authorize("ADMIN"),
  (req, _res, next) => {
    if (!req.body.userId) return next(new AppError("userId is required.", 422, "USER_ID_REQUIRED"));
    req.params.userId = req.body.userId;
    next();
  },
  users.updateUser
);
router.post(
  "/delete-user",
  authenticate,
  authorize("ADMIN"),
  (req, _res, next) => {
    if (!req.body.userId) return next(new AppError("userId is required.", 422, "USER_ID_REQUIRED"));
    req.params.userId = req.body.userId;
    next();
  },
  users.deleteUser
);

module.exports = router;
