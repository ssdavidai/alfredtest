import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

// EXECUTION METRIC SCHEMA
// Used to store daily billing metrics reported by VMs
// Tracks execution counts, durations, tokens, and success/failure rates per user per day
const executionMetricSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      // Format: YYYY-MM-DD
      validate: {
        validator: function(v) {
          return /^\d{4}-\d{2}-\d{2}$/.test(v);
        },
        message: props => `${props.value} is not a valid date format! Use YYYY-MM-DD`
      }
    },
    executionCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalDurationMs: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalTokens: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    successCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    failureCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Compound index to ensure uniqueness per user per day
executionMetricSchema.index({ userId: 1, date: 1 }, { unique: true });

// Add plugin that converts mongoose to json
executionMetricSchema.plugin(toJSON);

export default mongoose.models.ExecutionMetric || mongoose.model("ExecutionMetric", executionMetricSchema);
