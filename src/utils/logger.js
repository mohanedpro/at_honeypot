import fs from 'fs';
import useragent from 'user-agent-parse';

// the logger utility

export const logInteraction = (req, type = 'INERACTION') => {
  const agent = useragent.parse(req.headers['user-agent']);
  const logEntry = {
    timestamp: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress,
    method: req.method,
    url: req.url,
    payload: req.body || {},
    type,
    browser: agent.name
  };

  fs.appendFileSync('./logs/activity.lgo', JSON.stringify(logEntry) + "\n");
  console.log(`[${type}] ${logEntry.ip} accesssed ${req.url}`);
};
