// src/domain/pricing/models/pricing.model.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPricing extends Document {
  _id: Types.ObjectId;
  id: string;
  name: string;
  price: number;
  currency: 'NGN' | 'USD' | 'EUR' | 'GBP';
  billingCycle: 'monthly' | 'yearly' | 'one-time';
  features: string[];
  description?: string;
  isActive: boolean;
  displayOrder: number;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PricingSchema = new Schema<IPricing>(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      enum: ['NGN', 'USD', 'EUR', 'GBP'],
      default: 'NGN',
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly', 'one-time'],
      default: 'monthly',
    },
    features: {
      type: [String],
      required: [true, 'Features are required'],
      validate: {
        validator: function (v: string[]) {
          return v && v.length > 0;
        },
        message: 'At least one feature is required',
      },
    },
    description: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (_doc, ret: any) {
        ret.id = ret._id.toString();
        return ret;
      },
    },
  }
);

PricingSchema.index({ name: 1 });
PricingSchema.index({ isActive: 1 });
PricingSchema.index({ displayOrder: 1 });
PricingSchema.index({ deletedAt: 1 });

export const PricingModel = mongoose.model<IPricing>('Pricing', PricingSchema);