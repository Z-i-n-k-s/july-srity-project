const express = require("express");
const events = require("../controllers/julyEventController");
const items = require("../controllers/documentaryItemController");
const { authenticate } = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const validateObjectId = require("../middleware/validateObjectId");

/**
 * @openapi
 * /archive/events:
 *   get:
 *     tags:
 *     - July Events
 *     summary: List published July events
 *     operationId: get_archive_events
 *     security: []
 *     responses:
 *       '200':
 *         description: List published July events successfully.
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
 *     - name: eventType
 *       in: query
 *       required: false
 *       description: Filter by eventType.
 *       schema:
 *         type: string
 *         enum:
 *         - PROTEST
 *         - CLASH
 *         - MARCH
 *         - ARREST
 *         - INJURY
 *         - DEATH
 *         - INTERNET_SHUTDOWN
 *         - OTHER
 *     - name: tagId
 *       in: query
 *       required: false
 *       description: Filter by tagId.
 *       schema:
 *         type: string
 *     - name: from
 *       in: query
 *       required: false
 *       description: Filter by from.
 *       schema:
 *         type: string
 *         format: date-time
 *     - name: to
 *       in: query
 *       required: false
 *       description: Filter by to.
 *       schema:
 *         type: string
 *         format: date-time
 * /archive/events/slug/{slug}:
 *   get:
 *     tags:
 *     - July Events
 *     summary: Get a published July event by slug
 *     operationId: get_archive_events_slug_slug
 *     security: []
 *     responses:
 *       '200':
 *         description: Get a published July event by slug successfully.
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
 *     - name: slug
 *       in: path
 *       required: true
 *       description: slug path parameter.
 *       schema:
 *         type: string
 *         example: july-march-dhaka
 * /archive/items:
 *   get:
 *     tags:
 *     - Documentary Archive
 *     summary: List published documentary records
 *     operationId: get_archive_items
 *     security: []
 *     responses:
 *       '200':
 *         description: List published documentary records successfully.
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
 *     - name: featured
 *       in: query
 *       required: false
 *       description: Filter by featured.
 *       schema:
 *         type: boolean
 *     - name: tagId
 *       in: query
 *       required: false
 *       description: Filter by tagId.
 *       schema:
 *         type: string
 *     - name: sort
 *       in: query
 *       required: false
 *       description: Filter by sort.
 *       schema:
 *         type: string
 *         enum:
 *         - newest
 *         - oldest
 *         - popular
 * /archive/items/slug/{slug}:
 *   get:
 *     tags:
 *     - Documentary Archive
 *     summary: Get a published documentary record by slug
 *     operationId: get_archive_items_slug_slug
 *     security: []
 *     responses:
 *       '200':
 *         description: Get a published documentary record by slug successfully.
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
 *     - name: slug
 *       in: path
 *       required: true
 *       description: slug path parameter.
 *       schema:
 *         type: string
 *         example: july-march-dhaka
 * /archive/admin/events:
 *   get:
 *     tags:
 *     - July Events
 *     summary: List all July events
 *     operationId: get_archive_admin_events
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: List all July events successfully.
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
 *     - name: status
 *       in: query
 *       required: false
 *       description: Filter by status.
 *       schema:
 *         type: string
 *         enum:
 *         - DRAFT
 *         - VERIFIED
 *         - PUBLISHED
 *         - ARCHIVED
 *     - name: eventType
 *       in: query
 *       required: false
 *       description: Filter by eventType.
 *       schema:
 *         type: string
 *         enum:
 *         - PROTEST
 *         - CLASH
 *         - MARCH
 *         - ARREST
 *         - INJURY
 *         - DEATH
 *         - INTERNET_SHUTDOWN
 *         - OTHER
 *     - name: createdBy
 *       in: query
 *       required: false
 *       description: Filter by createdBy.
 *       schema:
 *         type: string
 *     - name: verifiedBy
 *       in: query
 *       required: false
 *       description: Filter by verifiedBy.
 *       schema:
 *         type: string
 *     - name: locationId
 *       in: query
 *       required: false
 *       description: Filter by locationId.
 *       schema:
 *         type: string
 *   post:
 *     tags:
 *     - July Events
 *     summary: Create a July event draft
 *     operationId: post_archive_admin_events
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '201':
 *         description: Create a July event draft successfully.
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
 *             $ref: '#/components/schemas/JulyEventWriteRequest'
 * /archive/admin/events/{eventId}:
 *   get:
 *     tags:
 *     - July Events
 *     summary: Get one July event for administration
 *     operationId: get_archive_admin_events_eventId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Get one July event for administration successfully.
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
 *     - name: eventId
 *       in: path
 *       required: true
 *       description: eventId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *   patch:
 *     tags:
 *     - July Events
 *     summary: Update a July event
 *     operationId: patch_archive_admin_events_eventId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Update a July event successfully.
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
 *     - name: eventId
 *       in: path
 *       required: true
 *       description: eventId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JulyEventWriteRequest'
 *   delete:
 *     tags:
 *     - July Events
 *     summary: Delete an unused non-published July event
 *     operationId: delete_archive_admin_events_eventId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Delete an unused non-published July event successfully.
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
 *     - name: eventId
 *       in: path
 *       required: true
 *       description: eventId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 * /archive/admin/events/{eventId}/status:
 *   patch:
 *     tags:
 *     - July Events
 *     summary: Change a July event status
 *     operationId: patch_archive_admin_events_eventId_status
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Change a July event status successfully.
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
 *     - name: eventId
 *       in: path
 *       required: true
 *       description: eventId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JulyEventStatusRequest'
 * /archive/admin/items:
 *   get:
 *     tags:
 *     - Documentary Archive
 *     summary: List all documentary archive records
 *     operationId: get_archive_admin_items
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: List all documentary archive records successfully.
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
 *         - PUBLISHED
 *         - HIDDEN
 *         - ARCHIVED
 *     - name: contentType
 *       in: query
 *       required: false
 *       description: Filter by contentType.
 *       schema:
 *         type: string
 *         enum:
 *         - STORY
 *         - IMAGE_GALLERY
 *         - VIDEO
 *         - AUDIO
 *         - DOCUMENT
 *         - TESTIMONY
 *     - name: verificationStatus
 *       in: query
 *       required: false
 *       description: Filter by verificationStatus.
 *       schema:
 *         type: string
 *         enum:
 *         - UNVERIFIED
 *         - SOURCE_CHECKED
 *         - PARTIALLY_VERIFIED
 *         - CORROBORATED
 *         - DISPUTED
 *         - MISLEADING_CONTEXT
 *     - name: featured
 *       in: query
 *       required: false
 *       description: Filter by featured.
 *       schema:
 *         type: boolean
 *   post:
 *     tags:
 *     - Documentary Archive
 *     summary: Create a documentary archive draft
 *     operationId: post_archive_admin_items
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '201':
 *         description: Create a documentary archive draft successfully.
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
 *             $ref: '#/components/schemas/DocumentaryItemWriteRequest'
 * /archive/admin/items/from-submission/{submissionId}:
 *   post:
 *     tags:
 *     - Documentary Archive
 *     summary: Create an archive draft from a verified submission
 *     operationId: post_archive_admin_items_from_submission_submissionId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '201':
 *         description: Create an archive draft from a verified submission successfully.
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
 *             $ref: '#/components/schemas/DocumentaryItemWriteRequest'
 * /archive/admin/items/apply-correction/{submissionId}:
 *   post:
 *     tags:
 *     - Documentary Archive
 *     summary: Apply a verified correction submission
 *     operationId: post_archive_admin_items_apply_correction_submissionId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Apply a verified correction submission successfully.
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
 *             $ref: '#/components/schemas/ApplyCorrectionRequest'
 * /archive/admin/items/{itemId}:
 *   get:
 *     tags:
 *     - Documentary Archive
 *     summary: Get one archive record for administration
 *     operationId: get_archive_admin_items_itemId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Get one archive record for administration successfully.
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
 *     - name: itemId
 *       in: path
 *       required: true
 *       description: itemId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *   patch:
 *     tags:
 *     - Documentary Archive
 *     summary: Update an archive record and preserve its previous version
 *     operationId: patch_archive_admin_items_itemId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Update an archive record and preserve its previous version successfully.
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
 *     - name: itemId
 *       in: path
 *       required: true
 *       description: itemId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DocumentaryItemWriteRequest'
 *   delete:
 *     tags:
 *     - Documentary Archive
 *     summary: Delete a hidden or archived record
 *     operationId: delete_archive_admin_items_itemId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Delete a hidden or archived record successfully.
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
 *     - name: itemId
 *       in: path
 *       required: true
 *       description: itemId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 * /archive/admin/items/{itemId}/status:
 *   patch:
 *     tags:
 *     - Documentary Archive
 *     summary: Change an archive record status
 *     operationId: patch_archive_admin_items_itemId_status
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Change an archive record status successfully.
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
 *     - name: itemId
 *       in: path
 *       required: true
 *       description: itemId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DocumentaryItemStatusRequest'
 * /archive/admin/items/{itemId}/versions:
 *   get:
 *     tags:
 *     - Documentary Archive
 *     summary: List archive record version history
 *     operationId: get_archive_admin_items_itemId_versions
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: List archive record version history successfully.
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
 *     - name: itemId
 *       in: path
 *       required: true
 *       description: itemId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 */

const router = express.Router();
router.get("/events", events.listPublic);
router.get("/events/slug/:slug", events.getPublicBySlug);
router.get("/items", items.listPublic);
router.get("/items/slug/:slug", items.getPublicBySlug);

router.use(authenticate, authorize("ADMIN"));
router.get("/admin/events", events.listAdmin);
router.post("/admin/events", events.create);
router.get("/admin/events/:eventId", validateObjectId("eventId"), events.getAdmin);
router.patch("/admin/events/:eventId", validateObjectId("eventId"), events.update);
router.patch("/admin/events/:eventId/status", validateObjectId("eventId"), events.changeStatus);
router.delete("/admin/events/:eventId", validateObjectId("eventId"), events.remove);

router.get("/admin/items", items.listAdmin);
router.post("/admin/items", items.create);
router.post("/admin/items/from-submission/:submissionId", validateObjectId("submissionId"), items.createFromSubmission);
router.post("/admin/items/apply-correction/:submissionId", validateObjectId("submissionId"), items.applyCorrection);
router.get("/admin/items/:itemId", validateObjectId("itemId"), items.getAdmin);
router.patch("/admin/items/:itemId", validateObjectId("itemId"), items.update);
router.patch("/admin/items/:itemId/status", validateObjectId("itemId"), items.changeStatus);
router.get("/admin/items/:itemId/versions", validateObjectId("itemId"), items.listVersions);
router.delete("/admin/items/:itemId", validateObjectId("itemId"), items.remove);
module.exports = router;
