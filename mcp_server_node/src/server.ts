import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GameService } from './game-service.ts';
import { config } from './config.ts';
import type {
  AchievementsResult,
  TurnResult,
} from '../../shared-types/game-types.ts';

const PET_WIDGET_URI = 'ui://widget/pet-v2.html';
const ACHIEVEMENTS_WIDGET_URI = 'ui://widget/achievements-v2.html';
const WIDGET_MIME_TYPE = 'text/html;profile=mcp-app';

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

  server.registerResource('pet-status', PET_WIDGET_URI, {}, () => {
    const frontendOrigin = new URL(config.FRONTEND_DOMAIN).origin;

    return {
      contents: [
        {
          uri: PET_WIDGET_URI,
          mimeType: WIDGET_MIME_TYPE,
          text: `
            <div id="pet-root"></div>
            <link rel="stylesheet" href="${frontendOrigin}/pet.css">
            <script type="module" src="${frontendOrigin}/pet.js"></script>
          `.trim(),
          _meta: {
            'openai/widgetDescription':
              "Renders a micro-UI showing the user's pet status.",
            ui: {
              domain: frontendOrigin,
              csp: {
                connectDomains: [],
                resourceDomains: [frontendOrigin],
              },
            },
            'openai/widgetDomain': frontendOrigin,
            'openai/widgetCSP': {
              connect_domains: [],
              resource_domains: [frontendOrigin],
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
        ui: { resourceUri: PET_WIDGET_URI },
        'openai/outputTemplate': PET_WIDGET_URI,
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
        ui: { resourceUri: PET_WIDGET_URI },
        'openai/outputTemplate': PET_WIDGET_URI,
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
        ui: { resourceUri: PET_WIDGET_URI },
        'openai/outputTemplate': PET_WIDGET_URI,
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
    ACHIEVEMENTS_WIDGET_URI,
    {},
    () => {
      const frontendOrigin = new URL(config.FRONTEND_DOMAIN).origin;

      return {
        contents: [
          {
            uri: ACHIEVEMENTS_WIDGET_URI,
            mimeType: WIDGET_MIME_TYPE,
            text: `
            <div id="achievements-root"></div>
            <link rel="stylesheet" href="${frontendOrigin}/achievements.css">
            <script type="module" src="${frontendOrigin}/achievements.js"></script>
          `.trim(),
            _meta: {
              'openai/widgetDescription':
                "Renders a micro-UI showing the user's achievements.",
              ui: {
                domain: frontendOrigin,
                csp: {
                  connectDomains: [],
                  resourceDomains: [frontendOrigin],
                },
              },
              'openai/widgetDomain': frontendOrigin,
              'openai/widgetCSP': {
                connect_domains: [],
                resource_domains: [frontendOrigin],
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
        ui: { resourceUri: ACHIEVEMENTS_WIDGET_URI },
        'openai/outputTemplate': ACHIEVEMENTS_WIDGET_URI,
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
