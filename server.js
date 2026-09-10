var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_config = require("dotenv/config");
var import_express = __toESM(require("express"), 1);
var import_genai = require("@google/genai");
var import_path = __toESM(require("path"), 1);
var API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
if (!API_KEY) {
  console.warn("[WARN] No GEMINI_API_KEY found in environment. AI endpoints will return errors.");
}
var genai = new import_genai.GoogleGenAI({ apiKey: API_KEY });
var MODEL = "gemini-2.0-flash";
var NHS_SYSTEM_PROMPT = `You are an NHS Digital Hospital AI Assistant embedded in a secure clinical portal.

Your roles vary by context:
- For PATIENTS: Provide clear, empathetic health information, symptom guidance, and triage recommendations using plain language. Always recommend seeking professional care when appropriate. Never provide a formal diagnosis.
- For CLINICAL STAFF: Provide evidence-based clinical decision support, ESI (Emergency Severity Index) triage suggestions based on vital signs, and reference relevant NICE guidelines.
- For HOSPITAL OPERATIONS/ADMIN: Provide analysis of ward metrics, bed occupancy trends, staffing recommendations, and capacity planning insights.

Always:
- Be professional, clear, and concise
- Acknowledge uncertainty when appropriate
- Prioritise patient safety
- Remind users this is AI decision support, not a replacement for clinical judgment
- Format responses with clear structure when presenting multiple points

This is a synthetic/demo environment for educational purposes.`;
var app = (0, import_express.default)();
app.use(import_express.default.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});
app.use((req, _res, next) => {
  console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${req.method} ${req.path}`);
  next();
});
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    apiKeyConfigured: Boolean(API_KEY),
    model: MODEL,
    service: "NHS Hospital AI Agent Backend"
  });
});
app.post("/api/chat", async (req, res) => {
  const { message, history = [], role = "patient" } = req.body;
  if (!message?.trim()) {
    res.status(400).json({ error: "message is required" });
    return;
  }
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  const roleContext = {
    patient: "You are helping a PATIENT. Use plain, empathetic language.",
    clinical: "You are helping a CLINICAL STAFF MEMBER. Use medical terminology appropriately.",
    admin: "You are helping a HOSPITAL OPERATIONS/ADMIN user. Focus on metrics and operational insights."
  };
  const systemInstruction = `${NHS_SYSTEM_PROMPT}

Current context: ${roleContext[role] ?? roleContext.patient}`;
  const contents = [
    ...history.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }]
    })),
    { role: "user", parts: [{ text: message }] }
  ];
  try {
    const stream = await genai.models.generateContentStream({
      model: MODEL,
      config: { systemInstruction },
      contents
    });
    for await (const chunk of stream) {
      const text = chunk.text ?? "";
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}

`);
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    const message2 = err instanceof Error ? err.message : "AI error";
    res.write(`data: ${JSON.stringify({ error: message2 })}

`);
    res.end();
  }
});
app.post("/api/triage", async (req, res) => {
  const {
    age,
    heartRate,
    systolicBP,
    respiratoryRate,
    spo2,
    temperature,
    consciousness,
    painScore,
    chestPain,
    breathingDifficulty,
    activeBleeding,
    chiefComplaint
  } = req.body;
  if (!chiefComplaint || age === void 0) {
    res.status(400).json({ error: "chiefComplaint and age are required" });
    return;
  }
  const prompt = `Assess the following patient for ESI (Emergency Severity Index) triage level (1=most critical, 5=least urgent).

Patient vitals:
- Age: ${age} years
- Heart Rate: ${heartRate ?? "N/A"} bpm
- Systolic BP: ${systolicBP ?? "N/A"} mmHg
- Respiratory Rate: ${respiratoryRate ?? "N/A"} breaths/min
- SpO2: ${spo2 ?? "N/A"}%
- Temperature: ${temperature ?? "N/A"}\xB0C
- Consciousness (AVPU): ${consciousness ?? "A"}
- Pain Score: ${painScore ?? 0}/10
- Chest Pain: ${chestPain ? "Yes" : "No"}
- Breathing Difficulty: ${breathingDifficulty ? "Yes" : "No"}
- Active Bleeding: ${activeBleeding ? "Yes" : "No"}
- Chief Complaint: ${chiefComplaint}

Respond ONLY with valid JSON in this exact format:
{
  "level": <1|2|3|4|5>,
  "label": "<Immediate|Emergent|Urgent|Less Urgent|Non-Urgent>",
  "rationale": "<2-3 sentence clinical rationale>",
  "immediateActions": ["<action 1>", "<action 2>", "<action 3>"],
  "timeToSee": "<e.g. Immediately|Within 15 minutes|Within 30 minutes|Within 60 minutes|Within 2 hours>"
}`;
  try {
    const response = await genai.models.generateContent({
      model: MODEL,
      config: {
        systemInstruction: NHS_SYSTEM_PROMPT,
        responseMimeType: "application/json"
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    const raw = response.text ?? "{}";
    const result = JSON.parse(raw);
    res.json(result);
  } catch (err) {
    console.error("[/api/triage] Error:", err);
    res.status(500).json({
      level: 3,
      label: "Urgent",
      rationale: "AI assessment unavailable. Please perform manual triage.",
      immediateActions: ["Manually assess patient", "Obtain full vital signs", "Notify senior clinician"],
      timeToSee: "Within 30 minutes"
    });
  }
});
app.post("/api/ward-insights", async (req, res) => {
  const { metrics } = req.body;
  if (!metrics) {
    res.status(400).json({ error: "metrics object is required" });
    return;
  }
  const prompt = `Based on the following NHS hospital ward metrics, provide a brief operational summary with key concerns and recommendations (3-5 bullet points max):

${JSON.stringify(metrics, null, 2)}

Be concise and actionable. Format as bullet points starting with \u2022`;
  try {
    const response = await genai.models.generateContent({
      model: MODEL,
      config: { systemInstruction: NHS_SYSTEM_PROMPT },
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    res.json({ insights: response.text ?? "Unable to generate insights." });
  } catch (err) {
    console.error("[/api/ward-insights] Error:", err);
    res.status(500).json({ error: "Failed to generate ward insights." });
  }
});
app.post("/api/symptom-check", async (req, res) => {
  const { symptoms, age } = req.body;
  if (!symptoms?.trim()) {
    res.status(400).json({ error: "symptoms description is required" });
    return;
  }
  const prompt = `A patient ${age ? `aged ${age}` : ""} is describing the following symptoms: "${symptoms}"

Provide:
1. A brief, empathetic assessment in plain English
2. An urgency classification: "emergency" (call 999), "urgent" (A&E or urgent care today), "routine" (see GP within a few days), or "self-care" (manage at home)
3. 3 practical self-care or next-step tips

Respond ONLY with valid JSON:
{
  "guidance": "<clear, empathetic 2-3 paragraph response>",
  "urgency": "<emergency|urgent|routine|self-care>",
  "nextSteps": ["<step 1>", "<step 2>", "<step 3>"]
}`;
  try {
    const response = await genai.models.generateContent({
      model: MODEL,
      config: {
        systemInstruction: NHS_SYSTEM_PROMPT,
        responseMimeType: "application/json"
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    const result = JSON.parse(response.text ?? "{}");
    res.json(result);
  } catch (err) {
    console.error("[/api/symptom-check] Error:", err);
    res.status(500).json({ error: "Symptom check failed. Please try again." });
  }
});
var distPath = import_path.default.join(process.cwd(), "dist");
app.use(import_express.default.static(distPath));
app.get("*", (_req, res) => {
  res.sendFile(import_path.default.join(distPath, "index.html"));
});
var PORT = parseInt(process.env.PORT ?? "8080", 10);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`
\u{1F3E5} NHS Hospital AI Agent Backend`);
  console.log(`   Running on http://0.0.0.0:${PORT}`);
  console.log(`   API Key: ${API_KEY ? "\u2713 configured" : "\u2717 NOT SET \u2014 AI endpoints disabled"}`);
  console.log(`   Model:   ${MODEL}`);
  console.log(`
Available endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/chat           \u2014 streaming AI chat (SSE)`);
  console.log(`   POST /api/triage         \u2014 ESI triage assessment`);
  console.log(`   POST /api/ward-insights  \u2014 operational ward summary`);
  console.log(`   POST /api/symptom-check  \u2014 patient symptom guidance
`);
});
var server_default = app;
