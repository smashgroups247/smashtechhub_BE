// src/domain/pricing/models/pricing.model.ts
import mongoose, { Schema, Document } from "mongoose";
import { IPricing } from "../types";

/**
 * Pricing Document Interface (extends Mongoose Document)
 */
export interface IPricingDocument extends Omit<IPricing, "_id">, Document {}

/**
 * Pricing Schema Definition
 */
const PricingSchema = new Schema<IPricingDocument>(
  {
    name: {
      type: String,
      required: [true, "Plan name is required"],
      trim: true,
      maxlength: [100, "Plan name cannot exceed 100 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      default: "NGN",
      uppercase: true,
      enum: ["NGN", "USD", "EUR", "GBP"],
    },
    billingCycle: {
      type: String,
      required: [true, "Billing cycle is required"],
      lowercase: true,
      enum: ["monthly", "yearly", "one-time"],
      default: "monthly",
    },
    features: {
      type: [String],
      required: [true, "Features are required"],
      validate: {
        validator: function (features: string[]) {
          return features.length > 0;
        },
        message: "At least one feature is required",
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
      min: [0, "Display order cannot be negative"],
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
          ret._id = ret._id.toString();
        }
        // Remove internal fields
        delete ret.__v;
        // Only delete deletedAt if it has a value
        if (ret.deletedAt) {
          delete ret.deletedAt;
        }
        return ret;
      },
    },
  },
);

// Indexes
PricingSchema.index({ name: 1 });
PricingSchema.index({ isActive: 1, displayOrder: 1 });
PricingSchema.index({ deletedAt: 1 });

// Virtual
PricingSchema.virtual("isDeleted").get(function () {
  return this.deletedAt !== null;
});

// Pre-save hook
PricingSchema.pre("save", function (this: any, next: any) {
  if (this.features && this.features.length === 0) {
    return next(new Error("At least one feature is required"));
  }
  next();
});

export const PricingModel = mongoose.model<IPricingDocument>(
  "Pricing",
  PricingSchema,
);
