// src/domain/contact/models/contact.model.ts
import mongoose, { Schema, Document } from "mongoose";
import { IContact, SERVICE_OPTIONS } from "../types";

/**
 * Contact Document Interface (extends Mongoose Document)
 */
export interface IContactDocument extends Omit<IContact, "_id">, Document {}

/**
 * Contact Schema Definition
 */
const ContactSchema = new Schema<IContactDocument>(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [100, "Full name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
      index: true,
    },
    serviceOfInterest: {
      type: String,
      required: [true, "Service of interest is required"],
      enum: {
        values: SERVICE_OPTIONS,
        message: "{VALUE} is not a valid service option",
      },
    },
    projectDetails: {
      type: String,
      required: [true, "Project details are required"],
      trim: true,
      minlength: [10, "Project details must be at least 10 characters"],
      maxlength: [2000, "Project details cannot exceed 2000 characters"],
    },
    status: {
      type: String,
      enum: ["new", "in-progress", "resolved"],
      default: "new",
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [1000, "Admin notes cannot exceed 1000 characters"],
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolvedAt: {
      type: Date,
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
    toJSON: {
      transform: function (_doc: any, ret: any) {
        // Convert ObjectId to string
        if (ret._id) {
          (ret as any)._id = ret._id.toString();
        }
        // Remove internal fields
        delete (ret as any).__v;
        // Only delete deletedAt if it has a value
        if (ret.deletedAt) {
          delete (ret as any).deletedAt;
        }
        return ret;
      },
    },
  },
);

// Indexes
ContactSchema.index({ email: 1, createdAt: -1 });
ContactSchema.index({ status: 1, createdAt: -1 });
ContactSchema.index({ deletedAt: 1 });
ContactSchema.index({
  fullName: "text",
  email: "text",
  projectDetails: "text",
});

// Virtual
ContactSchema.virtual("isDeleted").get(function () {
  return this.deletedAt !== null;
});

// Pre-save hook
ContactSchema.pre("save", function (this: any, next: any) {
  if (
    this.isModified("status") &&
    this.status === "resolved" &&
    !this.resolvedAt
  ) {
    this.resolvedAt = new Date();
  }
  next();
});

export const ContactModel = mongoose.model<IContactDocument>(
  "Contact",
  ContactSchema,
);
