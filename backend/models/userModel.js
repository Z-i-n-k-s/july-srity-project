const mongoose = require("mongoose");
const {
  USER_ROLES,
  ACCOUNT_STATUSES,
  LANGUAGES,
} = require("./modelEnums");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    // Optional for now so your existing signup form does not break.
    // Make it required later when the UI starts collecting usernames.
    username: {
      type: String,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 50,
      default: null,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: "USER",
      index: true,
    },
    avatarMediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MediaAsset",
      default: null,
    },

    // Temporary compatibility with an older frontend that expects a URL string.
    // New code should prefer avatarMediaId and populate MediaAsset.
    profilePic: {
      type: String,
      trim: true,
      default: "",
    },

    accountStatus: {
      type: String,
      enum: ACCOUNT_STATUSES,
      default: "ACTIVE",
      index: true,
    },
    preferredLanguage: {
      type: String,
      enum: LANGUAGES,
      default: "BN",
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    phoneVerifiedAt: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },

    // Raw reset tokens should never be stored. Store only a hash.
    passwordResetTokenHash: {
      type: String,
      select: false,
      default: null,
    },
    passwordResetTokenExpiresAt: {
      type: Date,
      select: false,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: null },
  }
);
userSchema.index(
  { username: 1 },
  {
    unique: true,
    partialFilterExpression: {
      username: { $type: "string" },
      deletedAt: null,
    },
  }
);
userSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: {
      phone: { $type: "string" },
      deletedAt: null,
    },
  }
);

const User =
  mongoose.models.User ||
  mongoose.model("User", userSchema, "users");

module.exports = User;
