const express = require("express");
const auth = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimits");

/**
 * @openapi
 * /auth/signup:
 *   post:
 *     tags:
 *     - Authentication
 *     summary: Register a new user
 *     operationId: post_auth_signup
 *     security: []
 *     responses:
 *       '201':
 *         description: User account created.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignUpRequest'
 * /auth/signin:
 *   post:
 *     tags:
 *     - Authentication
 *     summary: Sign in and issue access and refresh tokens
 *     operationId: post_auth_signin
 *     security: []
 *     responses:
 *       '200':
 *         description: User signed in.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignInRequest'
 * /auth/refresh:
 *   post:
 *     tags:
 *     - Authentication
 *     summary: Rotate the refresh session and issue a new access token
 *     operationId: post_auth_refresh
 *     security: []
 *     responses:
 *       '200':
 *         description: Rotate the refresh session and issue a new access token successfully.
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
 *     description: The refresh token may be sent in the JSON body or the refreshToken cookie.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 * /auth/logout:
 *   post:
 *     tags:
 *     - Authentication
 *     summary: Log out the current refresh session
 *     operationId: post_auth_logout
 *     security: []
 *     responses:
 *       '200':
 *         description: Log out the current refresh session successfully.
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
 *     description: The refresh token may be sent in the JSON body or the refreshToken cookie.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LogoutRequest'
 * /auth/logout-all:
 *   post:
 *     tags:
 *     - Authentication
 *     summary: Revoke all active sessions for the current user
 *     operationId: post_auth_logout_all
 *     security:
 *     - bearerAuth: []
 *     - cookieAuth: []
 *     responses:
 *       '200':
 *         description: Revoke all active sessions for the current user successfully.
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
 * /auth/forgot-password:
 *   post:
 *     tags:
 *     - Authentication
 *     summary: Request a password-reset email
 *     operationId: post_auth_forgot_password
 *     security: []
 *     responses:
 *       '200':
 *         description: Request a password-reset email successfully.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 * /auth/verify-reset-token/{token}:
 *   get:
 *     tags:
 *     - Authentication
 *     summary: Verify a password-reset token
 *     operationId: get_auth_verify_reset_token_token
 *     security: []
 *     responses:
 *       '200':
 *         description: Verify a password-reset token successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '422':
 *         $ref: '#/components/responses/UnprocessableEntity'
 *       '429':
 *         $ref: '#/components/responses/TooManyRequests'
 *       '503':
 *         $ref: '#/components/responses/ServiceUnavailable'
 *     parameters:
 *     - name: token
 *       in: path
 *       required: true
 *       description: token path parameter.
 *       schema:
 *         type: string
 *         example: password-reset-token
 * /auth/reset-password:
 *   post:
 *     tags:
 *     - Authentication
 *     summary: Reset the password using a valid reset token
 *     operationId: post_auth_reset_password
 *     security: []
 *     responses:
 *       '200':
 *         description: Reset the password using a valid reset token successfully.
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 */

const router = express.Router();
router.post("/signup", authLimiter, auth.signUp);
router.post("/signin", authLimiter, auth.signIn);
router.post("/refresh", authLimiter, auth.refresh);
router.post("/logout", auth.logout);
router.post("/logout-all", authenticate, auth.logoutAll);
router.post("/forgot-password", authLimiter, auth.forgotPassword);
router.get("/verify-reset-token/:token", authLimiter, auth.verifyResetToken);
router.post("/reset-password", authLimiter, auth.resetPassword);

module.exports = router;
