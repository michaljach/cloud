import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import turboPlugin from 'eslint-plugin-turbo'
import tseslint from 'typescript-eslint'
import onlyWarn from 'eslint-plugin-only-warn'
import importPlugin from 'eslint-plugin-import'

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
      import: importPlugin
    },
    rules: {
      'turbo/no-undeclared-env-vars': 'warn',
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type'
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true
          }
        }
      ]
    }
  },
  {
    plugins: {
      onlyWarn
    }
  },
  {
    ignores: ['dist/**']
  },
  {
    rules: {
      // Require a blank line after 'use client' directive
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: 'directive', next: '*' }
      ],
      // Enforce direct imports instead of React namespace usage
      'no-restricted-syntax': [
        'error',
        {
          selector: 'MemberExpression[object.name="React"]',
          message:
            'Use direct imports instead of React namespace (e.g., import { useState } from "react" instead of React.useState)'
        }
      ],
      // Override only-warn for import/order to make it error out
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type'
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true
          }
        }
      ]
    }
  }
]
