/**
 * Configuration Swagger/OpenAPI pour l'API de justification
 * Style personnel: documentation complete et interactive
 */

import swaggerJsdoc from 'swagger-jsdoc'
import type { Options } from 'swagger-jsdoc'

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tictactrip Justify API',
      version: '1.0.0',
      description: `
API REST de justification de texte développée pour le test technique Tictactrip.

## Fonctionnalités

- **Authentification par token** - Génération et validation de tokens sécurisés
- **Justification de texte** - Algorithme personnalisé pour justifier à 80 caractères
- **Rate limiting** - Limitation à 80 000 mots par jour par token
- **Architecture moderne** - TypeScript, patterns fonctionnels, validation rigoureuse

## Utilisation

1. Générez un token avec \`POST /api/token\`
2. Utilisez le token pour justifier du texte avec \`POST /api/justify\`
3. Surveillez votre quota de mots quotidien

## Algorithme de justification

L'algorithme distribue uniformément les espaces entre les mots pour atteindre exactement 80 caractères par ligne, 
sauf pour la dernière ligne qui reste alignée à gauche.
      `,
      contact: {
        name: 'Beviryon ISSANGA NGOULOU',
        email: 'viryon.ngoulou@gmail.com',
        url: 'https://github.com/Beviryon'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3003',
        description: 'Serveur de développement'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'Token',
          description: 'Token généré via l\'endpoint /api/token'
        }
      },
      schemas: {
        TokenRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
              description: 'Adresse email valide pour générer le token'
            }
          }
        },
        TokenResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              example: '973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b',
              description: 'Token d\'authentification unique (64 caractères)'
            }
          }
        },
        JustifyRequest: {
          type: 'string',
          example: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
          description: 'Texte en format plain/text à justifier'
        },
        JustifyResponse: {
          type: 'string',
          example: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor\\nincididunt ut labore et dolore magna aliqua.',
          description: 'Texte justifié avec exactement 80 caractères par ligne'
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Invalid email format',
              description: 'Message d\'erreur descriptif'
            }
          }
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'healthy',
              description: 'État du service'
            },
            service: {
              type: 'string',
              example: 'tictactrip-justify-api',
              description: 'Nom du service'
            },
            version: {
              type: 'string',
              example: '1.0.0',
              description: 'Version de l\'API'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-10-25T12:00:00.000Z',
              description: 'Timestamp de la réponse'
            },
            uptime: {
              type: 'number',
              example: 3600.5,
              description: 'Temps de fonctionnement en secondes'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Gestion des tokens d\'authentification'
      },
      {
        name: 'Text Processing',
        description: 'Justification de texte et traitement'
      },
      {
        name: 'Monitoring',
        description: 'Santé et surveillance du service'
      }
    ]
  },
  apis: [
    './src/modules/*.ts',
    './src/server.ts'
  ]
}

export const specs = swaggerJsdoc(options)
export default specs