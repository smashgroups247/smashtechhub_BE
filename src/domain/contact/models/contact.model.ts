// src/domain/contact/models/contact.model.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IContact extends Document {
  _id: Types.ObjectId;
  id: string;
  fullName: string;
  email: string;
  serviceOfInterest: string;
  projectDetails: string;
  status: 'new' | 'in-progress' | 'resolved';
  adminNotes?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    serviceOfInterest: {
      type: String,
      required: [true, 'Service of interest is required'],
    },
    projectDetails: {
      type: String,
      required: [true, 'Project details are required'],
    },
    status: {
      type: String,
      enum: ['new', 'in-progress', 'resolved'],
      default: 'new',
    },
    adminNotes: {
      type: String,
      default: '',
    },
    resolvedBy: {
      type: String,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
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

ContactSchema.index({ email: 1 });
ContactSchema.index({ status: 1 });
ContactSchema.index({ createdAt: -1 });
ContactSchema.index({ deletedAt: 1 });

export const ContactModel = mongoose.model<IContact>('Contact', ContactSchema);