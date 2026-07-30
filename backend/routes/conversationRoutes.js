const express = require("express");
const conversations = require("../controllers/conversationController");
const { authenticate } = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const validateObjectId = require("../middleware/validateObjectId");

/**
 * @openapi
 * /conversations:
 *   post:
 *     tags:
 *     - Conversations
 *     summary: Create a general enquiry conversation
 *     operationId: post_conversations
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '201':
 *         description: Create a general enquiry conversation successfully.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConversationCreateRequest'
 * /conversations/mine:
 *   get:
 *     tags:
 *     - Conversations
 *     summary: List conversations accessible to the current user
 *     operationId: get_conversations_mine
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: List conversations accessible to the current user successfully.
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
 *         - OPEN
 *         - WAITING_FOR_USER
 *         - WAITING_FOR_ADMIN
 *         - RESOLVED
 *         - CLOSED
 *     - name: type
 *       in: query
 *       required: false
 *       description: Filter by type.
 *       schema:
 *         type: string
 *         enum:
 *         - SUPPORT_ROOM
 *         - DOCUMENTARY_REVIEW
 *         - MISSING_PERSON_REVIEW
 *         - GENERAL_ENQUIRY
 * /conversations/admin:
 *   get:
 *     tags:
 *     - Conversations
 *     summary: List all conversations
 *     operationId: get_conversations_admin
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: List all conversations successfully.
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
 *         - OPEN
 *         - WAITING_FOR_USER
 *         - WAITING_FOR_ADMIN
 *         - RESOLVED
 *         - CLOSED
 *     - name: type
 *       in: query
 *       required: false
 *       description: Filter by type.
 *       schema:
 *         type: string
 *         enum:
 *         - SUPPORT_ROOM
 *         - DOCUMENTARY_REVIEW
 *         - MISSING_PERSON_REVIEW
 *         - GENERAL_ENQUIRY
 *     - name: subjectType
 *       in: query
 *       required: false
 *       description: Filter by subjectType.
 *       schema:
 *         type: string
 *         enum:
 *         - SUPPORT_CASE
 *         - DOCUMENTARY_SUBMISSION
 *         - MISSING_PERSON_REPORT
 *         - NONE
 *     - name: assignedAdminId
 *       in: query
 *       required: false
 *       description: Filter by assignedAdminId.
 *       schema:
 *         type: string
 *     - name: createdBy
 *       in: query
 *       required: false
 *       description: Filter by createdBy.
 *       schema:
 *         type: string
 * /conversations/{conversationId}:
 *   get:
 *     tags:
 *     - Conversations
 *     summary: Get a conversation and its participants
 *     operationId: get_conversations_conversationId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Get a conversation and its participants successfully.
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
 *     - name: conversationId
 *       in: path
 *       required: true
 *       description: conversationId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 * /conversations/{conversationId}/assign:
 *   patch:
 *     tags:
 *     - Conversations
 *     summary: Assign an administrator to a conversation
 *     operationId: patch_conversations_conversationId_assign
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Assign an administrator to a conversation successfully.
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
 *     - name: conversationId
 *       in: path
 *       required: true
 *       description: conversationId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConversationAssignRequest'
 * /conversations/{conversationId}/status:
 *   patch:
 *     tags:
 *     - Conversations
 *     summary: Change a conversation status
 *     operationId: patch_conversations_conversationId_status
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Change a conversation status successfully.
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
 *     - name: conversationId
 *       in: path
 *       required: true
 *       description: conversationId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConversationStatusRequest'
 * /conversations/{conversationId}/participants:
 *   post:
 *     tags:
 *     - Conversations
 *     summary: Invite a conversation participant
 *     operationId: post_conversations_conversationId_participants
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '201':
 *         description: Invite a conversation participant successfully.
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
 *     - name: conversationId
 *       in: path
 *       required: true
 *       description: conversationId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InviteParticipantRequest'
 * /conversations/{conversationId}/invitation:
 *   patch:
 *     tags:
 *     - Conversations
 *     summary: Accept or reject a pending conversation invitation
 *     operationId: patch_conversations_conversationId_invitation
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Accept or reject a pending conversation invitation successfully.
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
 *     - name: conversationId
 *       in: path
 *       required: true
 *       description: conversationId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InvitationResponseRequest'
 * /conversations/{conversationId}/participants/{userId}:
 *   delete:
 *     tags:
 *     - Conversations
 *     summary: Remove a conversation participant
 *     operationId: delete_conversations_conversationId_participants_userId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Remove a conversation participant successfully.
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
 *     - name: conversationId
 *       in: path
 *       required: true
 *       description: conversationId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     - name: userId
 *       in: path
 *       required: true
 *       description: userId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 * /conversations/{conversationId}/messages:
 *   get:
 *     tags:
 *     - Conversations
 *     summary: List conversation messages
 *     operationId: get_conversations_conversationId_messages
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: List conversation messages successfully.
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
 *     - name: conversationId
 *       in: path
 *       required: true
 *       description: conversationId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     - name: limit
 *       in: query
 *       required: false
 *       description: Maximum messages returned.
 *       schema:
 *         type: integer
 *         default: 50
 *         minimum: 1
 *         maximum: 100
 *     - name: before
 *       in: query
 *       required: false
 *       description: Return messages created before this timestamp.
 *       schema:
 *         type: string
 *         format: date-time
 *   post:
 *     tags:
 *     - Conversations
 *     summary: Send a conversation message
 *     operationId: post_conversations_conversationId_messages
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '201':
 *         description: Send a conversation message successfully.
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
 *     - name: conversationId
 *       in: path
 *       required: true
 *       description: conversationId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MessageCreateRequest'
 * /conversations/{conversationId}/messages/{messageId}:
 *   patch:
 *     tags:
 *     - Conversations
 *     summary: Edit a text message
 *     operationId: patch_conversations_conversationId_messages_messageId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Edit a text message successfully.
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
 *     - name: conversationId
 *       in: path
 *       required: true
 *       description: conversationId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     - name: messageId
 *       in: path
 *       required: true
 *       description: messageId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MessageEditRequest'
 *   delete:
 *     tags:
 *     - Conversations
 *     summary: Soft-delete a message
 *     operationId: delete_conversations_conversationId_messages_messageId
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Soft-delete a message successfully.
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
 *     - name: conversationId
 *       in: path
 *       required: true
 *       description: conversationId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     - name: messageId
 *       in: path
 *       required: true
 *       description: messageId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 * /conversations/{conversationId}/messages/{messageId}/read:
 *   post:
 *     tags:
 *     - Conversations
 *     summary: Mark a message as read
 *     operationId: post_conversations_conversationId_messages_messageId_read
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Mark a message as read successfully.
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
 *     - name: conversationId
 *       in: path
 *       required: true
 *       description: conversationId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     - name: messageId
 *       in: path
 *       required: true
 *       description: messageId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 * /conversations/{conversationId}/document-requests:
 *   get:
 *     tags:
 *     - Conversations
 *     summary: List document requests for a conversation
 *     operationId: get_conversations_conversationId_document_requests
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: List document requests for a conversation successfully.
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
 *     - name: conversationId
 *       in: path
 *       required: true
 *       description: conversationId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *   post:
 *     tags:
 *     - Conversations
 *     summary: Create a document request
 *     operationId: post_conversations_conversationId_document_requests
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '201':
 *         description: Create a document request successfully.
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
 *     - name: conversationId
 *       in: path
 *       required: true
 *       description: conversationId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DocumentRequestCreateRequest'
 * /conversations/{conversationId}/document-requests/{requestId}/submit:
 *   post:
 *     tags:
 *     - Conversations
 *     summary: Submit files for a document request
 *     operationId: post_conversations_conversationId_document_requests_requestId_submit
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Submit files for a document request successfully.
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
 *     - name: conversationId
 *       in: path
 *       required: true
 *       description: conversationId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     - name: requestId
 *       in: path
 *       required: true
 *       description: requestId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DocumentRequestSubmitRequest'
 * /conversations/{conversationId}/document-requests/{requestId}/status:
 *   patch:
 *     tags:
 *     - Conversations
 *     summary: Review a submitted document request
 *     operationId: patch_conversations_conversationId_document_requests_requestId_status
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Review a submitted document request successfully.
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
 *     - name: conversationId
 *       in: path
 *       required: true
 *       description: conversationId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     - name: requestId
 *       in: path
 *       required: true
 *       description: requestId path parameter.
 *       schema:
 *         type: string
 *         pattern: ^[a-fA-F0-9]{24}$
 *         example: 64b7f2e2c6f4a90f4a5e1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DocumentRequestReviewRequest'
 */

const router = express.Router();
router.use(authenticate);
router.post("/", conversations.createGeneral);
router.get("/mine", conversations.listMine);
router.get("/admin", authorize("ADMIN"), conversations.listAdmin);
router.get("/:conversationId", validateObjectId("conversationId"), conversations.getById);
router.patch("/:conversationId/assign", authorize("ADMIN"), validateObjectId("conversationId"), conversations.assignAdmin);
router.patch("/:conversationId/status", validateObjectId("conversationId"), conversations.changeStatus);
router.post("/:conversationId/participants", validateObjectId("conversationId"), conversations.inviteParticipant);
router.patch("/:conversationId/invitation", validateObjectId("conversationId"), conversations.respondToInvitation);
router.delete("/:conversationId/participants/:userId", validateObjectId("conversationId", "userId"), conversations.removeParticipant);
router.get("/:conversationId/messages", validateObjectId("conversationId"), conversations.listMessages);
router.post("/:conversationId/messages", validateObjectId("conversationId"), conversations.sendMessage);
router.patch("/:conversationId/messages/:messageId", validateObjectId("conversationId", "messageId"), conversations.editMessage);
router.delete("/:conversationId/messages/:messageId", validateObjectId("conversationId", "messageId"), conversations.deleteMessage);
router.post("/:conversationId/messages/:messageId/read", validateObjectId("conversationId", "messageId"), conversations.markMessageRead);
router.get("/:conversationId/document-requests", validateObjectId("conversationId"), conversations.listDocumentRequests);
router.post("/:conversationId/document-requests", authorize("ADMIN"), validateObjectId("conversationId"), conversations.createDocumentRequest);
router.post("/:conversationId/document-requests/:requestId/submit", validateObjectId("conversationId", "requestId"), conversations.submitDocumentRequest);
router.patch("/:conversationId/document-requests/:requestId/status", authorize("ADMIN"), validateObjectId("conversationId", "requestId"), conversations.reviewDocumentRequest);
module.exports = router;
