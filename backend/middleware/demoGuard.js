const isDemoSession = (req) => {
  return !!req?.tokenClaims?.demo;
};

const blockDemoWrites = (req, res, next) => {
  if (!isDemoSession(req)) return next();
  return res.status(403).json({
    error: 'Demo mode: this action is disabled. Contact sales team +966596775485 to get a free trial.'
  });
};

module.exports = {
  isDemoSession,
  blockDemoWrites
};
