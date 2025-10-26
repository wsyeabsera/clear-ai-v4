import mongoose from 'mongoose';

const ToolExecutionSchema = new mongoose.Schema({
  toolName: String,
  parameters: mongoose.Schema.Types.Mixed,
  dependsOn: String,
  outputMapping: mongoose.Schema.Types.Mixed,
});

const PlanWithRequestSchema = new mongoose.Schema({
  requestId: { type: String, required: true, index: true },
  planId: { type: String, required: true, unique: true },
  query: String,
  plan: String,
  selectedTools: [ToolExecutionSchema],
  toolOrder: [String],
  executionState: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'failed'],
    default: 'pending'
  },
  executionResults: mongoose.Schema.Types.Mixed,
  validationResult: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

export const PlanWithRequestModel = mongoose.model('PlanWithRequest', PlanWithRequestSchema);
