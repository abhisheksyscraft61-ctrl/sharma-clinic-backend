const response = (description) => ({ description });

const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'ClinicCare API',
    version: '1.0.0',
    description: 'ClinicCare patient management API'
  },
  servers: [{ url: '/', description: 'Current server' }],
  tags: [
    { name: 'Authentication' },
    { name: 'Clinics' },
    { name: 'Doctors' },
    { name: 'Patients' },
    { name: 'Visits' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      MessageResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        tags: ['Authentication'],
        summary: 'Check API health',
        responses: { 200: response('API is healthy') }
      }
    },
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password', minLength: 6 }
                }
              }
            }
          }
        },
        responses: { 201: response('User registered'), 400: response('Validation error') }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Log in and receive a JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', format: 'password' }
                }
              }
            }
          }
        },
        responses: { 200: response('Login successful'), 401: response('Invalid credentials') }
      }
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get the current user',
        security: [{ bearerAuth: [] }],
        responses: { 200: response('Current user'), 401: response('Unauthorized') }
      }
    },
    '/api/clinics': {
      get: { tags: ['Clinics'], summary: 'List clinics', security: [{ bearerAuth: [] }], responses: { 200: response('Clinic list') } },
      post: { tags: ['Clinics'], summary: 'Create a clinic', security: [{ bearerAuth: [] }], responses: { 201: response('Clinic created'), 400: response('Validation error') } }
    },
    '/api/clinics/{id}': {
      parameters: [{ $ref: '#/components/parameters/id' }],
      get: { tags: ['Clinics'], summary: 'Get a clinic', security: [{ bearerAuth: [] }], responses: { 200: response('Clinic details'), 404: response('Clinic not found') } },
      put: { tags: ['Clinics'], summary: 'Update a clinic', security: [{ bearerAuth: [] }], responses: { 200: response('Clinic updated') } },
      delete: { tags: ['Clinics'], summary: 'Delete a clinic', security: [{ bearerAuth: [] }], responses: { 200: response('Clinic deleted') } }
    },
    '/api/doctors': {
      get: { tags: ['Doctors'], summary: 'List doctors', security: [{ bearerAuth: [] }], responses: { 200: response('Doctor list') } },
      post: { tags: ['Doctors'], summary: 'Create a doctor', security: [{ bearerAuth: [] }], responses: { 201: response('Doctor created') } }
    },
    '/api/doctors/{id}': {
      parameters: [{ $ref: '#/components/parameters/id' }],
      get: { tags: ['Doctors'], summary: 'Get a doctor', security: [{ bearerAuth: [] }], responses: { 200: response('Doctor details') } },
      put: { tags: ['Doctors'], summary: 'Update a doctor', security: [{ bearerAuth: [] }], responses: { 200: response('Doctor updated') } },
      delete: { tags: ['Doctors'], summary: 'Delete a doctor', security: [{ bearerAuth: [] }], responses: { 200: response('Doctor deleted') } }
    },
    '/api/patients': {
      get: { tags: ['Patients'], summary: 'List patients', security: [{ bearerAuth: [] }], responses: { 200: response('Patient list') } },
      post: { tags: ['Patients'], summary: 'Create a patient', security: [{ bearerAuth: [] }], responses: { 201: response('Patient created') } }
    },
    '/api/patients/{id}': {
      parameters: [{ $ref: '#/components/parameters/id' }],
      get: { tags: ['Patients'], summary: 'Get a patient', security: [{ bearerAuth: [] }], responses: { 200: response('Patient details') } },
      put: { tags: ['Patients'], summary: 'Update a patient', security: [{ bearerAuth: [] }], responses: { 200: response('Patient updated') } },
      delete: { tags: ['Patients'], summary: 'Delete a patient', security: [{ bearerAuth: [] }], responses: { 200: response('Patient deleted') } }
    },
    '/api/visits/{id}': {
      parameters: [{ $ref: '#/components/parameters/id' }],
      get: { tags: ['Visits'], summary: 'Get a visit', security: [{ bearerAuth: [] }], responses: { 200: response('Visit details') } },
      delete: { tags: ['Visits'], summary: 'Delete a visit', security: [{ bearerAuth: [] }], responses: { 200: response('Visit deleted') } }
    }
  }
};

swaggerSpec.components.parameters = {
  id: {
    name: 'id',
    in: 'path',
    required: true,
    schema: { type: 'string' },
    description: 'Resource identifier'
  }
};

module.exports = swaggerSpec;
