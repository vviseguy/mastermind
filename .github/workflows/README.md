# GitHub Actions Workflows

This directory contains GitHub Actions workflow files used for CI/CD processes.

## Deploy to GitHub Pages

The `deploy.yml` workflow automatically builds and deploys the Mastermind game to GitHub Pages when changes are pushed to the main branch.

### Setup Instructions

1. Go to your GitHub repository settings
2. Navigate to "Pages" section
3. Under "Build and deployment", select "GitHub Actions" as the source
4. Make sure the repository has GitHub Pages enabled

## Important Notes

- Update the `homepage` field in package.json with your actual GitHub username
- The base path in vite.config.ts should match your repository name
- If your default branch is not named 'main', update the branch name in the workflow file 