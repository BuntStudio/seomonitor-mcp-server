# SEOMonitor MCP Server - HTTP Setup

This document provides instructions on how to run the SEOMonitor MCP Server with an HTTP transport and interact with its API.

## Running the Server

You can run the server either directly with Node.js or using the provided Docker configuration.

### Using Node.js

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Start the server in HTTP mode:**
    ```bash
    npm run start:http
    ```

    By default, the server will start on `http://localhost:3001`.

### Using Docker

The easiest way to get started is with Docker Compose. The default configuration is already set up for HTTP transport.

1.  **Build and run the container:**
    ```bash
    docker-compose up --build
    ```

    The server will be available at `http://localhost:3001`.

## Interacting with the API

Once the server is running, you can interact with it through its HTTP endpoints.

### 1. Create a User Session

Before executing any tools, you must create a session for a user. This authenticates the server with the SEOMonitor API on behalf of that user.

**Endpoint:** `POST /api/mcp/session`

**Body:**
```json
{
  "userId": "unique_user_id_123",
  "apiKey": "YOUR_SEOMONITOR_API_KEY",
  "baseUrl": "https://apigw.seomonitor.com"
}
```

**Example `curl` command:**
```bash
cURL -X POST http://localhost:3001/api/mcp/session \
-H "Content-Type: application/json" \
-d '{
  "userId": "user-test-1",
  "apiKey": "your-seomonitor-api-key",
  "baseUrl": "https://apigw.seomonitor.com"
}'
```

### 2. List Available Tools

To see all the tools the server provides, you can make a GET request to the tools endpoint.

**Endpoint:** `GET /api/mcp/tools`

**Example `curl` command:**
```bash
curl http://localhost:3001/api/mcp/tools
```

### 3. Execute a Tool

To execute a tool, make a POST request to the specific tool's endpoint. The tool's arguments, including the `userId` from the session you created, must be passed in the request body.

**Endpoint:** `POST /api/mcp/tools/:toolName`

**Example `curl` command (for `get_tracked_campaigns` tool):**
```bash
curl -X POST http://localhost:3001/api/mcp/tools/get_tracked_campaigns \
-H "Content-Type: application/json" \
-d '{
  "userId": "user-test-1"
}'
```

This will execute the `get_tracked_campaigns` tool using the session associated with `user-test-1`.

## Production Deployment on a VPS

For deploying the server to a public VPS (like Hetzner), it is critical to use the provided production Docker Compose setup, which includes an Nginx reverse proxy for security and HTTPS.

### Prerequisites

1.  A domain name pointing to your VPS IP address.
2.  SSL certificates for your domain (you can obtain free ones from Let's Encrypt).

### Setup Steps

1.  **Configure Nginx:**
    - Open `docker/nginx.conf`.
    - Replace all instances of `your_domain.com` with your actual domain name.

2.  **Add SSL Certificates:**
    - Create a `ssl` directory inside the `docker` directory.
    - Place your SSL certificate (`fullchain.pem`) and private key (`privkey.pem`) inside `docker/ssl/`.

3.  **Create Production Environment File:**
    - Create a `.env.production` file in the root of the project.
    - Add the following environment variables. The `API_KEY` here acts as a master key for the server itself.

    ```
    # Master API key for server-level authentication
    API_KEY=your_strong_secret_master_api_key

    # Restrict to specific domains for better security
    CORS_ORIGIN=https://your-frontend-app.com
    ```

4.  **Run Production Docker Compose:**
    ```bash
    docker-compose -f docker/docker-compose.prod.yml up --build -d
    ```

Your server will now be running securely, accessible only via HTTPS on your domain.
