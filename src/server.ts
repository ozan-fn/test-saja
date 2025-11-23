import "dotenv/config";
import express from "express";
import multer from "multer";
import fs from "fs";
import { generateImage } from "./index";

const app = express();
const port = process.env.PORT || 3000;

// Counter to ensure maximum 2 processes at a time
let processingCount = 0;

// Configure multer for file uploads (in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Ensure tmp directory exists
if (!fs.existsSync("./tmp")) {
    fs.mkdirSync("./tmp");
}

app.get("/", (req, res) => res.send("OK"));

app.post("/generate", upload.single("image"), async (req, res) => {
    if (processingCount >= 10) {
        return res.status(429).json({ error: "Maximum 10 requests are being processed. Please try again later." });
    }

    processingCount++;

    try {
        const { prompt } = req.body;
        const imageBuffer = req.file?.buffer;

        if (!imageBuffer || !prompt) {
            return res.status(400).json({ error: "Image and prompt are required" });
        }

        // Save the uploaded image temporarily to a file for Puppeteer
        const tempImagePath = `./tmp/temp_${Date.now()}.png`;
        fs.writeFileSync(tempImagePath, imageBuffer);

        // Run the image generation
        const outputBuffer = await generateImage(tempImagePath, prompt);

        // Clean up temp file
        fs.unlinkSync(tempImagePath);

        if (outputBuffer) {
            const base64Image = `data:image/png;base64,${outputBuffer.toString("base64")}`;
            res.json({ image: base64Image });
        } else {
            res.status(500).json({ error: "Image generation failed" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    } finally {
        processingCount--;
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
