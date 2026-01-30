// src/domain/contact/models/contact.model.ts
import mongoose, { Schema, Document } from 'mongoose';
import { IContact, SERVICE_OPTIONS } from '../types';

/**
 * Contact Document Interface (extends Mongoose Document)
 */
export interface IContactDocument extends IContact, Document {
  _id: string;
}

/**
 * Contact Schema Definition
 */
const ContactSchema = new Schema<IContactDocument>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    serviceOfInterest: {
      type: String,
      required: [true, 'Service of interest is required'],
      enum: {
        values: SERVICE_OPTIONS,
        message: '{VALUE} is not a valid service option',
      },
    },
    projectDetails: {
      type: String,
      required: [true, 'Project details are required'],
      trim: true,
      minlength: [10, 'Project details must be at least 10 characters'],
      maxlength: [2000, 'Project details cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: ['new', 'in-progress', 'resolved'],
      default: 'new',
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Admin notes cannot exceed 1000 characters'],
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: {
      transform: function (doc, ret) {
        ret._id = ret._id.toString();
        delete ret.__v;
        // Don't return deletedAt in JSON response
        if (ret.deletedAt) {
          delete ret.deletedAt;
        }
        return ret;
      },
    },
  }
);

// Indexes for better query performance
ContactSchema.index({ email: 1, createdAt: -1 });
ContactSchema.index({ status: 1, createdAt: -1 });
ContactSchema.index({ deletedAt: 1 });
ContactSchema.index({ fullName: 'text', email: 'text', projectDetails: 'text' }); // Text search

// Virtual for checking if contact is deleted (soft delete)
ContactSchema.virtual('isDeleted').get(function () {
  return this.deletedAt !== null;
});

// Pre-save hook to set resolvedAt when status changes to resolved
ContactSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'resolved' && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }
  next();
});

// Pre-update hook to set resolvedAt when status changes to resolved
ContactSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as any;
  
  if (update.$set && update.$set.status === 'resolved' && !update.$set.resolvedAt) {
    update.$set.resolvedAt = new Date();
  }
  
  next();
});

/**
 * Export Contact Model
 */
export const ContactModel = mongoose.model<IContactDocument>('Contact', ContactSchema);