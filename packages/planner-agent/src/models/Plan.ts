import mongoose, { Schema, Document } from 'mongoose';

export interface IPlan extends Document {
  input: string;
  output: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema: Schema = new Schema(
  {
    input: {
      type: String,
      required: true,
    },
    output: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Plan = mongoose.model<IPlan>('Plan', PlanSchema);
