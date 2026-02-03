# 🖼️ Recomend API

<div align="center">
  <img src="./assets/recomend_icon.svg" alt="Recomend logo" width="100" />
  <h2 align="center">Recomend API</h2>
</div>

The main **NestJS (with Fastify)**-based API service for the Recomend application. It handles search functionalities for movies, TV series, persons, users, and playlists, alongside user authentication and other backend operations. Developed by [@lxup](https://github.com/lxup).

## 🚀 Tech Stack

- ⚡️ [NestJS](https://nestjs.com/) – A progressive Node.js framework for building efficient, reliable and scalable server-side applications.
- 🚀 [Fastify](https://fastify.dev/) – Fast and low overhead web framework, for Node.js.
- 🖌️ [Typesense](https://typesense.org/) – Lightning-fast, open source search engine.
- 🛡️ [Supabase](https://supabase.com/) – Open source Firebase alternative for authentication, database, and storage.

## 📦 Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/recomendapp/api.git
   cd api
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.template .env
   ```

   _Add your environment variables to the `.env` file._

4. **Run the development server:**
   ```bash
   pnpm run dev
   ```

## 📚 API Documentation

Explore the API routes and their documentation using the Swagger interface:

- **Swagger UI Endpoint**: /api-docs
- **OpenAPI JSON Schema Endpoint**: /api-docs-json
- **Description**: Access the interactive Swagger UI to view and test all available API endpoints, including parameters and response formats. The raw OpenAPI JSON schema is also available.

Visit http://localhost:9000/api-docs after starting the service to explore the API documentation.
