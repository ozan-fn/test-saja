import "dotenv/config";
import { generateImage } from "./index";

async function testGenerateImage() {
    try {
        const imagePath = "./test.jpeg"; // Ensure this file exists
        const prompt = "warna biru coba"; // Base64 encoded prompt

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
