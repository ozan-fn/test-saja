# Gemini Imagen API

A REST API that automates image generation using Google's Gemini AI Studio via Puppeteer.

## Features

-   Upload an image and provide a prompt
-   Automates Gemini AI Studio to generate a modified image
-   Returns the generated image as PNG

## Installation

```bash
pnpm install
```

## Setup

1. Copy `.env.example` to `.env` and configure your environment variables.
2. Set up `proxies.json` with your proxy details.
3. The script uses user data persistence in `./user-data` for login sessions. This directory is committed to the repo for shared persistence across deployments.

## Running the API

```bash
pnpm start
```

The server will run on http://localhost:3000.

## Docker

```bash
docker build -t gemini-imagen .
docker run -p 3000:3000 \
  -v $(pwd)/proxies.json:/app/proxies.json \
  gemini-imagen
```

Note: `user-data` is included in the image for session persistence across deployments.

## API Endpoint

### POST /generate

Generate an image based on the uploaded image and prompt.

**Request:**

-   Content-Type: multipart/form-data
-   Fields:
    -   `image`: The input image file (e.g., JPEG, PNG)
    -   `prompt`: Text prompt describing the desired modification

**Response:**

-   Success: JSON with `image` field containing the base64-encoded PNG (e.g., `{"image": "data:image/png;base64,..."}`)
-   Error: JSON with `error` message

**Example using curl:**

```bash
curl -X POST http://localhost:3000/generate \
  -F "image=@input.jpg" \
  -F "prompt=Apply traditional clothing to this image"
```

## Development

```bash
pnpm run dev
```

Runs the server with file watching.

## Build

```bash
pnpm run build
```

Compiles TypeScript to JavaScript in the `dist` folder.
