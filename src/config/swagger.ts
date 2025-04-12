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
