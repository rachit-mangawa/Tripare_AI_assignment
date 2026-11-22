export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Hotel Offer Orchestrator API',
    version: '1.0.0',
    description:
      'Backend service orchestrating multi-supplier hotel offers, deduplicating best prices via Temporal.io, and storing in Redis with sorted set price filtering.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local development server',
    },
  ],
  paths: {
    '/api/hotels': {
      get: {
        summary: 'Get deduplicated hotel offers or filter by price',
        description:
          'Triggers Temporal orchestration across Supplier A and B, deduplicates by hotel name picking the cheaper price, saves to Redis, and optionally filters by price range inside Redis.',
        parameters: [
          {
            name: 'city',
            in: 'query',
            required: true,
            schema: { type: 'string', example: 'delhi' },
            description: 'City name to query hotel offers for',
          },
          {
            name: 'minPrice',
            in: 'query',
            required: false,
            schema: { type: 'number', example: 5000 },
            description: 'Minimum price filter',
          },
          {
            name: 'maxPrice',
            in: 'query',
            required: false,
            schema: { type: 'number', example: 6000 },
            description: 'Maximum price filter',
          },
        ],
        responses: {
          '200': {
            description: 'List of deduplicated hotels with best rates',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/DeduplicatedHotel' },
                },
                example: [
                  {
                    name: 'Holtin',
                    price: 5340,
                    supplier: 'Supplier B',
                    commissionPct: 20,
                  },
                  {
                    name: 'Radison',
                    price: 5900,
                    supplier: 'Supplier A',
                    commissionPct: 13,
                  },
                ],
              },
            },
          },
          '400': {
            description: 'Missing city parameter',
          },
        },
      },
    },
    '/health': {
      get: {
        summary: 'Service and Supplier Health Check',
        description: 'Checks health of Supplier A, Supplier B, and Redis connection.',
        responses: {
          '200': {
            description: 'All suppliers healthy',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
          '503': {
            description: 'One or more suppliers degraded',
          },
        },
      },
    },
    '/supplierA/hotels': {
      get: {
        summary: 'Mock Supplier A Hotels',
        parameters: [
          {
            name: 'city',
            in: 'query',
            required: false,
            schema: { type: 'string', example: 'delhi' },
          },
        ],
        responses: {
          '200': {
            description: 'Supplier A hotel listings',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/SupplierHotel' },
                },
              },
            },
          },
        },
      },
    },
    '/supplierB/hotels': {
      get: {
        summary: 'Mock Supplier B Hotels',
        parameters: [
          {
            name: 'city',
            in: 'query',
            required: false,
            schema: { type: 'string', example: 'delhi' },
          },
        ],
        responses: {
          '200': {
            description: 'Supplier B hotel listings',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/SupplierHotel' },
                },
              },
            },
          },
        },
      },
    },
    '/supplier/simulate-down': {
      post: {
        summary: 'Simulate supplier downtime for resilience testing',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  supplier: { type: 'string', enum: ['A', 'B'] },
                  down: { type: 'boolean' },
                },
                required: ['supplier', 'down'],
              },
              example: {
                supplier: 'B',
                down: true,
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Status updated',
          },
        },
      },
    },
  },
  components: {
    schemas: {
      DeduplicatedHotel: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Holtin' },
          price: { type: 'number', example: 5340 },
          supplier: { type: 'string', example: 'Supplier B' },
          commissionPct: { type: 'number', example: 20 },
        },
        required: ['name', 'price', 'supplier', 'commissionPct'],
      },
      SupplierHotel: {
        type: 'object',
        properties: {
          hotelId: { type: 'string', example: 'a1' },
          name: { type: 'string', example: 'Holtin' },
          price: { type: 'number', example: 6000 },
          city: { type: 'string', example: 'delhi' },
          commissionPct: { type: 'number', example: 10 },
        },
        required: ['hotelId', 'name', 'price', 'city', 'commissionPct'],
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'healthy' },
          timestamp: { type: 'string', example: '2026-11-22T14:00:00.000Z' },
          suppliers: {
            type: 'object',
            properties: {
              supplierA: { type: 'string', example: 'UP' },
              supplierB: { type: 'string', example: 'UP' },
            },
          },
          redis: { type: 'string', example: 'UP' },
        },
      },
    },
  },
};
