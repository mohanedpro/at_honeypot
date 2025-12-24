import { logInteraction } from "../utils/logger.js";

// the deception middleware
export const deceptionLayer = (req, res, next) => {
  res.removeHeader("X-Powered-By");

  res.setHeader("Server", "Apache/2,4,6 (CentOS) PHP/5.4.16");
  res.setHeader("X-Powered-By", "PHP/5.4.16");

  logInteraction(req); // silent logging

  next();
};
