import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tsParser from '@typescript-eslint/parser';
import boundaries from 'eslint-plugin-boundaries';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      boundaries,
    },
    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**/*' },
        { type: 'app', pattern: 'src/components/*.{ts,tsx}' },
        { type: 'app', pattern: 'src/components/!(ui)/**/*' },
        { type: 'feature', pattern: 'src/features/*/**/*', capture: ['slice'] },
        { type: 'shared-ui', pattern: 'src/components/ui/**/*' },
        { type: 'shared-lib', pattern: 'src/{lib,config,types,env.ts,instrumentation.ts}/**/*' }
      ]
    },
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // 2026 Enterprise Protocol: Accessibility (A11y)
      ...(jsxA11y.configs?.recommended?.rules || jsxA11y.rules),

      // 2026 Enterprise Protocol: Type Safety
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        {
          assertionStyle: 'never', // Block 'as Type' and '<Type>'
        },
      ],

      // Strict Architectural Boundaries
      'boundaries/entry-point': 'error',
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            {
              from: { element: { type: 'app' } },
              allow: [
                { to: { element: { type: 'app' } } },
                { to: { element: { type: 'feature' } } },
                { to: { element: { type: 'shared-ui' } } },
                { to: { element: { type: 'shared-lib' } } },
              ],
            },
            {
              from: { element: { type: 'feature' } },
              allow: [
                { to: { element: { type: 'feature', captured: { slice: '{{from.captured.slice}}' } } } },
                { to: { element: { type: 'shared-ui' } } },
                { to: { element: { type: 'shared-lib' } } },
              ],
            },
            {
              from: { element: { type: 'shared-ui' } },
              allow: [
                { to: { element: { type: 'shared-lib' } } },
              ],
            },
            {
              from: { element: { type: 'shared-lib' } },
              allow: [],
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
