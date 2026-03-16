# GitHub Actions CI/CD Setup

This repository includes a comprehensive CI/CD pipeline using GitHub Actions.

## Workflow Overview

The CI/CD pipeline includes the following jobs:

### 1. Test Job

- Runs on Ubuntu latest
- Uses Node.js 20.x
- Installs dependencies with `npm ci`
- Runs linting with `npm run lint`
- Performs type checking with `npm run typecheck`
- Executes tests with `npm test`
- Builds the project with `npm run build`

### 2. Security Job

- Runs security audit with `npm audit --audit-level=moderate`
- Checks for known vulnerabilities in dependencies

### 3. Preview Deployment (Pull Requests)

- Automatically deploys to a preview environment when a pull request is created
- Uses GitHub Pages for deployment
- Provides a live preview URL for testing

### 4. Production Deployment (Main Branch)

- Automatically deploys to production when changes are pushed to main
- Uses GitHub Pages for deployment
- Only runs on pushes to the main branch

## GitHub Pages Setup

No additional secrets are required! GitHub Pages deployment uses the built-in `GITHUB_TOKEN` that's automatically available in GitHub Actions.

### Enabling GitHub Pages

1. Go to your GitHub repository settings
2. Navigate to "Pages" in the left sidebar
3. Under "Source", select "GitHub Actions"
4. Save the settings

### Preview URLs

- **Preview**: `https://yourusername.github.io/wild-and-wanderful/preview/pr-{number}/`
- **Production**: `https://yourusername.github.io/wild-and-wanderful/`

## Usage

### Automatic Triggers

- **Pull Requests**: When you create a PR to main, the test and security jobs run, and a preview deployment is created
- **Main Branch**: When you push to main, tests run and production deployment is triggered

### Manual Triggers

You can manually trigger workflows from the Actions tab in your GitHub repository.

## Customization

### Adding More Node.js Versions

To test against multiple Node.js versions, modify the `test` job in `.github/workflows/ci.yml`:

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x, 22.x]
```

### Adding Code Coverage

To add code coverage reporting:

1. Install a coverage tool like `vitest` with coverage support
2. Add coverage generation to your test script
3. Configure the codecov action in the workflow

### Alternative Deployment Platforms

If you're not using Vercel, you can replace the deployment steps with:

- **Netlify**: Use `netlify/actions` instead
- **GitHub Pages**: Use `peaceiris/actions-gh-pages`
- **Custom hosting**: Add your deployment commands

## Troubleshooting

### Common Issues

1. **Build failures**: Check that all dependencies are properly listed in `package.json`
2. **Deployment failures**: Verify GitHub Pages is enabled in repository settings
3. **Test failures**: Ensure your test environment is properly set up

### Debugging

- Check the Actions tab in GitHub for detailed logs
- Run tests locally with `npm test` to reproduce issues
- Verify your build works locally with `npm run build`
