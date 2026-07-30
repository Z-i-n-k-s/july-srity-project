// backend/config/swagger.js

const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");

const routesPath = path
  .join(__dirname, "../routes/**/*.js")
  .replace(/\\/g, "/");

const controllersPath = path
  .join(__dirname, "../controllers/**/*.js")
  .replace(/\\/g, "/");

const port = Number(process.env.PORT) || 8080;

const swaggerOptions = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "July Smriti Archive API",
      version: "1.0.0",
      description:
        "Interactive API documentation for the July Smriti Archive backend.",

      contact: {
        name: "July Smriti Archive Development Team",
      },
    },

    servers: [
      {
        url: `http://localhost:${port}/api`,
        description: "Local development server",
      },
    ],

    tags: [
      {
        name: "Authentication",
        description:
          "Registration, login, logout, token refresh and password management",
      },
      {
        name: "Users",
        description: "User profile and admin user management",
      },
      {
        name: "Media",
        description: "Cloudinary media upload and management",
      },
      {
        name: "Taxonomy",
        description: "Tags and locations",
      },
      {
        name: "Documentary Submissions",
        description:
          "Stories, testimonies, images, videos and document submissions",
      },
      {
        name: "Documentary Archive",
        description: "Verified and publicly published archive content",
      },
      {
        name: "Verification",
        description: "Admin verification and review operations",
      },
      {
        name: "Support Cases",
        description: "Injured-person support requests",
      },
      {
        name: "Missing Persons",
        description: "Missing-person reports and sightings",
      },
      {
        name: "Conversations",
        description: "User and admin support conversations",
      },
      {
        name: "Notifications",
        description: "User notifications",
      },
      {
        name: "Governance",
        description:
          "Consent, moderation, admin notes, audit logs and settings",
      },
      {
        name: "Public",
        description: "Public information and statistics",
      },
      {
        name: "Offline",
        description: "Offline draft synchronization",
      },
      {
        name: "Legacy Compatibility",
        description:
          "Deprecated endpoints retained for the existing frontend",
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Enter the accessToken returned by the sign-in endpoint.",
        },

        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
          description:
            "HTTP-only authentication cookie created after signup or signin.",
        },
      },

      schemas: {
        ObjectId: {
          type: "string",
          pattern: "^[a-fA-F0-9]{24}$",
          example: "64b7f2e2c6f4a90f4a5e1234",
          description: "MongoDB ObjectId",
        },

        SuccessResponse: {
          type: "object",

          properties: {
            success: {
              type: "boolean",
              example: true,
            },

            message: {
              type: "string",
              example: "Operation completed successfully.",
            },

            data: {
              nullable: true,

              oneOf: [
                {
                  type: "object",
                  additionalProperties: true,
                },
                {
                  type: "array",
                  items: {},
                },
                {
                  type: "string",
                },
                {
                  type: "number",
                },
                {
                  type: "boolean",
                },
              ],
            },
          },

          required: ["success", "message"],
          additionalProperties: true,
        },

        StandardSuccessResponse: {
          allOf: [
            {
              $ref: "#/components/schemas/SuccessResponse",
            },
          ],
        },

        ErrorResponse: {
          type: "object",

          properties: {
            success: {
              type: "boolean",
              example: false,
            },

            message: {
              type: "string",
              example: "The submitted information is invalid.",
            },

            error: {
              type: "object",
              nullable: true,

              properties: {
                code: {
                  type: "string",
                  example: "VALIDATION_ERROR",
                },

                details: {
                  nullable: true,

                  oneOf: [
                    {
                      type: "object",
                      additionalProperties: true,
                    },
                    {
                      type: "array",
                      items: {},
                    },
                    {
                      type: "string",
                    },
                  ],
                },
              },

              required: ["code"],
              additionalProperties: true,
            },
          },

          required: ["success", "message"],
          additionalProperties: false,
        },

        StandardErrorResponse: {
          allOf: [
            {
              $ref: "#/components/schemas/ErrorResponse",
            },
          ],
        },

        PaginationMeta: {
          type: "object",

          properties: {
            page: {
              type: "integer",
              example: 1,
            },

            limit: {
              type: "integer",
              example: 20,
            },

            total: {
              type: "integer",
              example: 45,
            },

            totalPages: {
              type: "integer",
              example: 3,
            },

            hasNextPage: {
              type: "boolean",
              example: true,
            },

            hasPreviousPage: {
              type: "boolean",
              example: false,
            },
          },

          additionalProperties: false,
        },

        PaginatedResponse: {
          type: "object",

          properties: {
            success: {
              type: "boolean",
              example: true,
            },

            message: {
              type: "string",
              example: "Records retrieved successfully.",
            },

            data: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: true,
              },
            },

            meta: {
              $ref: "#/components/schemas/PaginationMeta",
            },
          },

          required: ["success", "message", "data", "meta"],
          additionalProperties: true,
        },

        SignUpRequest: {
          type: "object",

          required: [
            "name",
            "email",
            "password",
            "confirmPassword",
          ],

          properties: {
            name: {
              type: "string",
              minLength: 1,
              maxLength: 120,
              example: "Rahim Ahmed",
            },

            email: {
              type: "string",
              format: "email",
              example: "rahim@example.com",
            },

            password: {
              type: "string",
              format: "password",
              minLength: 8,
              example: "StrongPassword123!",
            },

            confirmPassword: {
              type: "string",
              format: "password",
              minLength: 8,
              example: "StrongPassword123!",
              description:
                "Must match password. This field is validated but is never stored.",
            },
          },

          additionalProperties: false,
        },

        SignInRequest: {
          type: "object",

          required: ["email", "password"],

          properties: {
            email: {
              type: "string",
              format: "email",
              example: "pagol@shafin.com",
            },

            password: {
              type: "string",
              format: "password",
              minLength: 8,
              example: "12345678",
            },
          },

          additionalProperties: false,
        },

        ForgotPasswordRequest: {
          type: "object",

          required: ["email"],

          properties: {
            email: {
              type: "string",
              format: "email",
              example: "rahim@example.com",
            },
          },

          additionalProperties: false,
        },

        ResetPasswordRequest: {
          type: "object",

          required: [
            "token",
            "password",
            "confirmPassword",
          ],

          properties: {
            token: {
              type: "string",
              example: "password-reset-token",
            },

            password: {
              type: "string",
              format: "password",
              minLength: 8,
              example: "NewStrongPassword123!",
            },

            confirmPassword: {
              type: "string",
              format: "password",
              minLength: 8,
              example: "NewStrongPassword123!",
            },
          },

          additionalProperties: false,
        },

        RefreshTokenRequest: {
          type: "object",

          properties: {
            refreshToken: {
              type: "string",
              example: "refresh-token-value",
              description:
                "Optional when the refresh-token HTTP-only cookie exists.",
            },
          },

          additionalProperties: false,
        },

        UpdateProfileRequest: {
          type: "object",

          properties: {
            name: {
              type: "string",
              example: "Rahim Ahmed",
            },

            username: {
              type: "string",
              example: "rahim",
            },

            phone: {
              type: "string",
              example: "+8801700000000",
            },

            profilePic: {
              type: "string",
              example:
                "https://res.cloudinary.com/example/image/upload/profile.jpg",
            },

            avatarMediaId: {
              $ref: "#/components/schemas/ObjectId",
            },

            preferredLanguage: {
              type: "string",
              enum: ["BN", "EN"],
              example: "BN",
            },
          },

          additionalProperties: false,
        },

        AdminUpdateUserRequest: {
          type: "object",

          properties: {
            name: {
              type: "string",
              example: "Rahim Ahmed",
            },

            username: {
              type: "string",
              example: "rahim",
            },

            email: {
              type: "string",
              format: "email",
              example: "rahim@example.com",
            },

            phone: {
              type: "string",
              example: "+8801700000000",
            },

            role: {
              type: "string",
              enum: ["USER", "ADMIN"],
              example: "USER",
            },

            accountStatus: {
              type: "string",
              enum: ["ACTIVE", "SUSPENDED", "BLOCKED"],
              example: "ACTIVE",
            },

            preferredLanguage: {
              type: "string",
              enum: ["BN", "EN"],
              example: "BN",
            },
          },

          additionalProperties: false,
        },
      },

      parameters: {
        PageParam: {
          name: "page",
          in: "query",
          required: false,
          description: "Page number starting from 1.",

          schema: {
            type: "integer",
            minimum: 1,
            default: 1,
          },
        },

        LimitParam: {
          name: "limit",
          in: "query",
          required: false,
          description: "Number of records returned per page.",

          schema: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 20,
          },
        },

        SearchParam: {
          name: "q",
          in: "query",
          required: false,
          description: "Search text.",

          schema: {
            type: "string",
          },
        },
      },

      responses: {
        BadRequest: {
          description:
            "The request is malformed or contains invalid information.",

          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },

              example: {
                success: false,
                message: "The request is invalid.",
                error: {
                  code: "BAD_REQUEST",
                  details: null,
                },
              },
            },
          },
        },

        Unauthorized: {
          description:
            "Authentication is required or the access token is invalid.",

          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },

              example: {
                success: false,
                message:
                  "Authentication is required. Please sign in.",
                error: {
                  code: "AUTHENTICATION_REQUIRED",
                  details: null,
                },
              },
            },
          },
        },

        Forbidden: {
          description:
            "The authenticated user does not have permission to perform this action.",

          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },

              example: {
                success: false,
                message:
                  "You do not have permission to perform this action.",
                error: {
                  code: "FORBIDDEN",
                  details: null,
                },
              },
            },
          },
        },

        NotFound: {
          description: "The requested resource was not found.",

          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },

              example: {
                success: false,
                message: "The requested resource was not found.",
                error: {
                  code: "RESOURCE_NOT_FOUND",
                  details: null,
                },
              },
            },
          },
        },

        Conflict: {
          description:
            "The request conflicts with an existing database record or workflow state.",

          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },

              example: {
                success: false,
                message:
                  "An account already exists with this email address.",
                error: {
                  code: "EMAIL_ALREADY_REGISTERED",
                  details: null,
                },
              },
            },
          },
        },

        UnprocessableEntity: {
          description:
            "The request body is valid JSON but failed application validation.",

          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },

              example: {
                success: false,
                message:
                  "The submitted information did not pass validation.",
                error: {
                  code: "VALIDATION_ERROR",
                  details: null,
                },
              },
            },
          },
        },

        PayloadTooLarge: {
          description:
            "The uploaded file or request body exceeds the configured size limit.",

          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },

        UnsupportedMediaType: {
          description: "The supplied media type is not supported.",

          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },

        TooManyRequests: {
          description:
            "Too many requests were sent from this client.",

          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },

              example: {
                success: false,
                message:
                  "Too many requests from this client. Please try again later.",
                error: {
                  code: "RATE_LIMITED",
                  details: null,
                },
              },
            },
          },
        },

        BadGateway: {
          description:
            "An external service such as Cloudinary failed.",

          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },
            },
          },
        },

        ServiceUnavailable: {
          description:
            "The database or another required service is temporarily unavailable.",

          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },

              example: {
                success: false,
                message:
                  "The database is temporarily unavailable.",
                error: {
                  code: "DATABASE_UNAVAILABLE",
                  details: null,
                },
              },
            },
          },
        },

        InternalServerError: {
          description:
            "An unexpected internal server error occurred.",

          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ErrorResponse",
              },

              example: {
                success: false,
                message:
                  "An unexpected server error occurred.",
                error: {
                  code: "INTERNAL_SERVER_ERROR",
                  details: null,
                },
              },
            },
          },
        },
      },
    },
  },

  apis: [
    routesPath,
    controllersPath,
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec;