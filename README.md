# github-action-organiza-cards-columns-project

This action will replicate icon of columns project to cards of column.
The name of columns need use a icon separate by hifen, like "😀 - Column Name", them all card will be title with icon "😀 - Name of Card";

## Inputs

### `github-token`

**Required** `${{ secrets.GITHUB_TOKEN }}`

## Example usage

```
name: Update pull-request body
on:
  schedule:
    - cron:  '*/2 * * *'

jobs:
  update-pr:
    runs-on: ubuntu-latest
    steps:
      - name: Update PR Body
        uses: chiaretto/github-action-organiza-cards-columns-project@master
        with:
          github-token: "${{ secrets.GITHUB_TOKEN }}"
```