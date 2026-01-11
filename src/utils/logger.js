import dotenv from 'dotenv';
import fs from 'fs';
import useragent from 'user-agent-parse';
import SplunkLogger from 'splunk-logging';

// Load environment variables from the .env file
dotenv.config();

/**
 * Splunk Connection Configuration
 * Variables are pulled from process.env for security when pushing to GitHub.
 */
const config = {
    token: process.env.SPLUNK_TOKEN,
    url: process.env.SPLUNK_URL || "http://127.0.0.1:8088",
    protocol: "http",
    port: 8088
};

// Initialize the Splunk Logger instance
let splunk = null;
if (config.token) {
    splunk = new SplunkLogger.Logger(config);
} else {
    console.log("[Splunk Logger] Warning: No SPLUNK_TOKEN found in .env file.");
}

/**
 * Main logging function to record attacker interactions.
 * It saves data locally to a file and sends it to the Splunk SIEM.
 */
export const logInteraction = (req, type = 'INTERACTION') => {
    // Parse the attacker's browser and device info
    const agent = useragent.parse(req.headers['user-agent']);
    
    // Construct the security log event
    const logEntry = {
        timestamp: new Date().toISOString(),
        ip: req.ip || req.connection.remoteAddress,
        method: req.method,
        url: req.url,
        payload: req.body || {}, // Captures submitted usernames/passwords
        type,
        browser: agent.name,
        os: agent.os
    };

    // 1. LOCAL LOGGING: Append the event to a local file for backup
    try {
        fs.appendFileSync('./logs/activity.log', JSON.stringify(logEntry) + "\n");
    } catch (err) {
        console.error("[Local Logger] Error saving to file:", err.message);
    }

    // 2. REMOTE LOGGING (SPLUNK): Send the event to your SIEM dashboard
    if (splunk) {
        splunk.send({ message: logEntry }, (err, resp, body) => {
            if (err) {
                console.log("[Splunk Logger] Connection Error: Is Splunk running and SSL disabled?");
            } else {
                // Success - Data has reached Splunk
                console.log(`[Splunk] Event sent successfully: ${body.text}`);
            }
        });
    }

    // Console output for real-time monitoring in VS Code terminal
    console.log(`[${type}] Attacker IP: ${logEntry.ip} | Action: ${req.method} ${req.url}`);
};