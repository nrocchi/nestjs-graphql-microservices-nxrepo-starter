const nxPlugin = require('@nx/eslint-plugin')
const eslintPluginPrettier = require('eslint-plugin-prettier')
const typescriptEslintPlugin = require('@typescript-eslint/eslint-plugin')
const typescriptEslintParser = require('@typescript-eslint/parser')

module.exports = [
  {
    ignores: ['node_modules/**', 'dist/**', '.nx/**', 'jest.preset.js', '**/*.config.js'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@nx': nxPlugin,
      '@typescript-eslint': typescriptEslintPlugin,
      prettier: eslintPluginPrettier,
    },
    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: ['./tsconfig.base.json', './apps/*/tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // NX rules
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],

      // Prettier rules - this will show formatting errors in red
      'prettier/prettier': 'error',

      // Variables and constants
      'prefer-const': 'error',
      'no-var': 'error',
      'no-unused-vars': 'off', // Using TypeScript's version instead
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // Code quality
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-unreachable': 'error',
      'no-constant-condition': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],

      // Best practices
      eqeqeq: ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-return-await': 'error',
      'require-await': 'error',
      'no-throw-literal': 'error',

      // TypeScript specific
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-empty-function': ['error', { allow: ['constructors'] }],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          prefix: ['I'],
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
        },
        {
          selector: 'enum',
          format: ['PascalCase'],
        },
      ],

      // Import/Export
      'no-duplicate-imports': 'error',
      'sort-imports': [
        'error',
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
        },
      ],

      // TypeScript ESLint recommended rules
      ...typescriptEslintPlugin.configs.recommended.rules,
    },
  },
]
