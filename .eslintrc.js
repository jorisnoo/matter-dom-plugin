module.exports = {
    root: true,
    env: {
        es6: true,
        browser: true,
        node: true,
    },
    parserOptions: {
        ecmaVersion: 2019,
        sourceType: 'module',
    },
    extends: [
        'eslint:recommended',
    ],
    plugins: [],
    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
        indent: ['warn', 4, {SwitchCase: 1}],
        semi: ['error', 'always'],
        quotes: ['error', 'single', {avoidEscape: true}],
    },
};
