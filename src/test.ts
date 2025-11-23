// Set environment variables for testing
process.env.PUPPETEER_EXECUTABLE_PATH = "/home/ozan/.cache/puppeteer/chrome/linux-142.0.7444.175/chrome-linux64/chrome";
process.env.HEADLESS = "true";

import { generateImage } from "./index";

async function testGenerateImage() {
    try {
        const imagePath = "./test.jpeg"; // Ensure this file exists
        const prompt = 'Apply the traditional clothing "Baju Bodo" from Sulawesi Selatan to this image.'; // Base64 encoded prompt

        console.log("Starting image generation...");
        const result = await generateImage(imagePath, prompt);

        if (result) {
            console.log("Image generated successfully!");
            // Optionally save or log the base64
            console.log("Base64 length:", result.length);
        } else {
            console.log("Image generation failed.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

testGenerateImage();
