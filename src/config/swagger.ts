import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "How Do I Look API",
      version: "1.0.0",
      description: "API documentation for How Do I Look application",
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:3005",
        description: "Development server",
      },
    ],
    components: {
      schemas: {
        Pokemon: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Unique identifier for the Pokemon",
            },
            pokemon_id: {
              type: "number",
              description: "Auto-incremented Pokemon ID",
            },
            owner: {
              type: "string",
              description: "ID of the user who owns this Pokemon",
            },
            name: {
              type: "string",
              description: "Name of the Pokemon",
            },
            type: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  color: { type: "string" },
                },
              },
              description: "Types of the Pokemon",
            },
            description: {
              type: "string",
              description: "Description of the Pokemon",
            },
            abilities: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Abilities of the Pokemon",
            },
            base_stats: {
              type: "object",
              properties: {
                health: {
                  type: "number",
                  description: "Health stat",
                },
                attack: {
                  type: "number",
                  description: "Attack stat",
                },
                defense: {
                  type: "number",
                  description: "Defense stat",
                },
                speed: {
                  type: "number",
                  description: "Speed stat",
                },
                intelligence: {
                  type: "number",
                  description: "Intelligence stat",
                },
                special: {
                  type: "number",
                  description: "Special stat",
                },
              },
            },
            rarity: {
              type: "string",
              description: "Rarity of the Pokemon",
            },
            habitat: {
              type: "string",
              description: "Natural habitat of the Pokemon",
            },
            behavior: {
              type: "string",
              description: "Behavior of the Pokemon",
            },
            preferred_items: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Items preferred by the Pokemon",
            },
            height: {
              type: "string",
              description: "Height of the Pokemon",
            },
            weight: {
              type: "string",
              description: "Weight of the Pokemon",
            },
            image: {
              type: "string",
              description: "URL of the Pokemon's image",
            },
            is_favorite: {
              type: "boolean",
              description: "Whether the Pokemon is marked as favorite",
            },
            is_public: {
              type: "boolean",
              description: "Whether the Pokemon is public",
            },
          },
        },
      },
      securitySchemes: {
        sessionAuth: {
          type: "apiKey",
          in: "cookie",
          name: "connect.sid",
        },
        idTokenAuth: {
          type: "apiKey",
          in: "body",
          name: "id_token",
        },
      },
    },
    security: [
      {
        sessionAuth: [
          {
            type: "apiKey",
            in: "cookie",
            name: "connect.sid",
            description: "Session ID",
            required: true,
          },
        ],
        idTokenAuth: [
          {
            type: "apiKey",
            in: "body",
            name: "id_token",
            description: "ID Token",
            required: true,
          },
        ],
      },
    ],
  },
  apis: ["./src/Routes/*.ts"], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
