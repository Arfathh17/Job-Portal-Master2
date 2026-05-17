const roleAliases = {
  jobseeker: 'candidate',
  employer: 'recruiter',
};

function normalizeRole(role = 'candidate') {
  return roleAliases[role] || role;
}

module.exports = normalizeRole;
