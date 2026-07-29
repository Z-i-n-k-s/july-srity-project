const mongoose = require("mongoose");
const { ADMIN_NOTE_TARGET_TYPES } = require("./modelEnums");

const adminNoteSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ADMIN_NOTE_TARGET_TYPES,
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    note: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

adminNoteSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

const AdminNote =
  mongoose.models.AdminNote ||
  mongoose.model("AdminNote", adminNoteSchema, "admin_notes");

module.exports = AdminNote;
