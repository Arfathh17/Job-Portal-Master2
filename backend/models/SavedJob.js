const mongoose = require('mongoose');

const SavedJobSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
    index: true,
  },
  externalId: {
    type: String,
    required: true,
  },
  title: String,
  company: String,
  location: String,
  salary: mongoose.Schema.Types.Mixed,
  description: String,
  applyLink: String,
  url: String,
  source: String,
  type: String,
  remote: Boolean,
  jobSnapshot: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

SavedJobSchema.index({ user: 1, externalId: 1 }, { unique: true });

module.exports = mongoose.model('SavedJob', SavedJobSchema);
