import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GameService } from './game-service.ts';
import { config } from './config.ts';
import type {
  AchievementsResult,
  TurnResult,
} from '../../shared-types/game-types.ts';

export function getServer(): McpServer {
  const server = new McpServer({
    name: 'chatagotchi-server',
    version: '0.1.0',
  });

  server.registerPrompt('new-game', { title: 'Start a new game' }, () => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Let's start a brand new chatagotchi game`,
        },
      },
    ],
  }));

  server.registerResource('pet-status', 'ui://widget/pet.html', {}, () => {
    return {
      contents: [
        {
          uri: 'ui://widget/pet.html',
          mimeType: 'text/html+skybridge',
          text: `
            <div id="pet-root"></div>
            <link rel="stylesheet" href="${config.FRONTEND_DOMAIN}/pet.css">
            <script type="module" src="${config.FRONTEND_DOMAIN}/pet.js"></script>
          `.trim(),
          _meta: {
            'openai/widgetDescription':
              "Renders a micro-UI showing the user's pet status.",
            ui: {
              domain: config.FRONTEND_DOMAIN,
              csp: {
                connectDomains: [],
                resourceDomains: [config.FRONTEND_DOMAIN],
              },
            },
            'openai/widgetDomain': config.FRONTEND_DOMAIN,
            'openai/widgetCSP': {
              connect_domains: [],
              resource_domains: [config.FRONTEND_DOMAIN],
            },
          },
        },
      ],
    };
  });

  server.registerTool(
    'new-game',
    {
      title: 'Start a new game',
      description:
        'Kicks off a new game with a brand new pet. Be sure to name them!',
      _meta: {
        'openai/outputTemplate': 'ui://widget/pet.html',
        'openai/toolInvocation/invoking': 'Waking up your new pet',
        'openai/toolInvocation/invoked': 'Say hello to your new pet!',
        'openai/widgetAccessible': true,
      },
      inputSchema: { name: z.string() },
    },
    async ({ name }, { authInfo }) => {
      const gameService = new GameService(authInfo);
      const result = await gameService.startNewGame(name);

      return {
        content: [
          {
            type: 'text',
            text: result.message,
          },
        ],
        structuredContent: {
          petState: result.petState,
          newAchievements: [],
          lastAction: { type: 'new-game', emoji: '' },
        } satisfies TurnResult,
      };
    }
  );

  server.registerTool(
    'feed',
    {
      title: 'Feed your pet',
      description:
        'Feed your pet with 🍎 Apple, 🍪 Cookie, 🥗 Salad, or 🍕 Pizza',
      _meta: {
        'openai/outputTemplate': 'ui://widget/pet.html',
        'openai/toolInvocation/invoking': 'Feeding your pet',
        'openai/toolInvocation/invoked': 'Fed your pet!',
        'openai/widgetAccessible': true,
      },
      inputSchema: {
        food: z.enum(['🍎', '🍪', '🥗', '🍕']).describe('The food to feed'),
      },
    },
    async ({ food }, { authInfo }) => {
      const gameService = new GameService(authInfo);
      const result = await gameService.feedPet(food);

      if (!result) {
        return {
          content: [{ type: 'text', text: 'You need to start a game first!' }],
          structuredContent: { petState: null },
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: result.message,
          },
        ],
        structuredContent: {
          petState: result.petState,
          newAchievements: result.newAchievements,
          lastAction: { type: 'food', emoji: food },
        } satisfies TurnResult,
      };
    }
  );

  server.registerTool(
    'play',
    {
      title: 'Play with your pet',
      description:
        'Play with your pet: 🎮 Video Games, 🏃 Go for Run, or 🎿 Skiing in Alps',
      _meta: {
        'openai/outputTemplate': 'ui://widget/pet.html',
        'openai/toolInvocation/invoking': 'Playing with your pet',
        'openai/toolInvocation/invoked': 'Played with your pet!',
        'openai/widgetAccessible': true,
      },
      inputSchema: {
        activity: z.enum(['🎮', '🏃', '🎿']).describe('The activity to do'),
      },
    },
    async ({ activity }, { authInfo }) => {
      const gameService = new GameService(authInfo);
      const result = await gameService.playWithPet(activity);

      if (!result) {
        return {
          content: [{ type: 'text', text: 'You need to start a game first!' }],
          structuredContent: {
            petState: null,
            lastAction: { type: 'new-game', emoji: '' },
            newAchievements: [],
          } satisfies TurnResult,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: result.message,
          },
        ],
        structuredContent: {
          petState: result.petState,
          newAchievements: result.newAchievements,
          lastAction: { type: 'play', emoji: activity },
        } satisfies TurnResult,
      };
    }
  );

  server.registerResource(
    'achievements-widget',
    'ui://widget/achievements.html',
    {},
    () => {
      return {
        contents: [
          {
            uri: 'ui://widget/achievements.html',
            mimeType: 'text/html+skybridge',
            text: `
            <div id="achievements-root"></div>
            <link rel="stylesheet" href="${config.FRONTEND_DOMAIN}/achievements.css">
            <script type="module" src="${config.FRONTEND_DOMAIN}/achievements.js"></script>
          `.trim(),
            _meta: {
              'openai/widgetDescription':
                "Renders a micro-UI showing the user's achievements.",
              ui: {
                domain: config.FRONTEND_DOMAIN,
                csp: {
                  connectDomains: [],
                  resourceDomains: [config.FRONTEND_DOMAIN],
                },
              },
              'openai/widgetDomain': config.FRONTEND_DOMAIN,
              'openai/widgetCSP': {
                connect_domains: [],
                resource_domains: [config.FRONTEND_DOMAIN],
              },
            },
          },
        ],
      };
    }
  );

  server.registerTool(
    'achievements',
    {
      title: 'View Achievements',
      description: 'View all your unlocked and locked achievements',
      _meta: {
        'openai/outputTemplate': 'ui://widget/achievements.html',
        'openai/toolInvocation/invoking': 'Loading your achievements',
        'openai/toolInvocation/invoked': 'Here are your achievements!',
        'openai/widgetAccessible': true,
      },
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {},
    },
    async (_input, { authInfo }) => {
      const gameService = new GameService(authInfo);
      const result = await gameService.getAchievements();

      return {
        content: [
          {
            type: 'text',
            text: `You've unlocked ${result.unlockedCount} out of ${result.totalCount} achievements!`,
          },
        ],
        structuredContent: {
          unlockedAchievements: result.unlockedAchievements,
        } satisfies AchievementsResult,
      };
    }
  );

  return server;
}
