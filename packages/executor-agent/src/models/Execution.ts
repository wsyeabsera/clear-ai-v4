import mongoose, { Schema, Document } from 'mongoose';

export interface IExecution extends Document {
  input: string;
  output: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExecutionSchema: Schema = new Schema(
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

export const Execution = mongoose.model<IExecution>('Execution', ExecutionSchema);
