// @ts-check
// Lint do app: presets do ESLint, typescript-eslint e angular-eslint, mais as regras locais
// do Vibe Coding Toolkit. Severidades e contagens da adoção estão em docs/quality.md.
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import quality from './eslint-rules/index.cjs';

export default tseslint.config(
  // eslint-rules/ e o autoteste são cópias fiéis do toolkit; rodam em `npm run check:rules`.
  {
    ignores: [
      'dist/',
      '.angular/',
      'node_modules/',
      '.claude/',
      '.agents/',
      'public/',
      'graphify-out/',
      'eslint-rules/',
      'scripts/verify-quality-rules.mjs',
    ],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    plugins: { quality },
    rules: {
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
      // Promessa esquecida ou passada onde se espera void: os dois erros assíncronos mais comuns.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      // `const { password: _password, ...resto } = obj` tira um campo sem acusar variável sem uso.
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true, argsIgnorePattern: '^_' }],
      // Arquivo com mais de 350 linhas pede divisão por responsabilidade.
      'quality/max-lines': ['error', { max: 350 }],
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: { 'quality/max-lines': ['warn', { max: 350, includeTests: true }] },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
  },
);
