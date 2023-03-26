const core = require('@actions/core');
const github = require('@actions/github');
const { graphql } = require("@octokit/graphql");
const { Repository } = require("@octokit/graphql-schema");

// Toolkit docs: https://github.com/actions/toolkit
async function run() {
  try {

    const inputs = {
      token: core.getInput('github-token', {required: true}),
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
    };

    // Get Projects From Repo
    let queryRepo = `{
        repository(owner: "`+inputs.owner+`", name: "`+inputs.repo+`") {
          projectsV2(first: 10) {
            nodes {
              id
              title
            }
          }
        }
        }`
    // console.log(queryRepo)
    const { repository } = await graphql(
        queryRepo
        ,
        {
          headers: {
            authorization: `token `+inputs.token,
          },
        }
    );
    console.log(repository)
    if (repository?.projectsV2?.nodes?.length) {
      // Get Card Of Project
      for (project of repository.projectsV2.nodes) {
        console.log("Project Title:", project.title)
        let perPage = 50
        let hasNextPage = false
        let endCursor = ''
        do {
          const query = `{
                node(id: "` + project.id + `") {
                  ... on ProjectV2 {
                    title
                    id
                    items(first: ` + perPage + endCursor + `) {
                      edges {
                        node {
                          id
                          type
                          fieldValueByName(name: "Status") {
                            ... on ProjectV2ItemFieldSingleSelectValue {
                              name
                            }
                          }
                          content {
                            ... on PullRequest {
                              id
                              title
                            }
                            ... on Issue {
                              id
                              title
                            }
                            ... on DraftIssue {
                              id
                              title
                            }
                          }
                        }
                      }
                      pageInfo {
                        hasNextPage
                        endCursor
                      }
                    }
                  }
                }
              }`
          // console.log(query)
          const {node} = await graphql(
              query,
              {
                headers: {
                  authorization: `token ` + inputs.token,
                },
              }
          );
          let mutations = []
          for (let item of node.items.edges) {
            // console.log(item)
            if (item.node?.fieldValueByName?.name) {
              let titleStatusSplited = item.node?.fieldValueByName?.name.split('-')
              if (titleStatusSplited[0].trim().length <= 2) {
                let iconStatus = titleStatusSplited[0].trim()
                let titleCardSplited = item.node.content.title.split('-')
                let newTitleCard = iconStatus + ' ' + titleCardSplited.join(' - ').replace(/[^a-zA-Z0-9_\(\)\[\]\- ]/g, '').replace(/  +/g, ' ').trim()
                console.log('[' + item.node.type + '] (' + item.node.id + ') oldtitleCard:', item.node.content.title, ' | newTitleCard:', newTitleCard)
                if (item.node.content.title !== newTitleCard) {
                  let mutation = ''
                  switch (item.node.type) {
                    case 'ISSUE':
                      mutation = `MyMutation` + item.node.content.id + `: updateIssue(input: {id: "` + item.node.content.id + `", title: "` + newTitleCard + `"}) {clientMutationId}`
                      break;
                    case 'DRAFT_ISSUE':
                      mutation = `MyMutation` + item.node.content.id + `: updateProjectV2DraftIssue(input: {draftIssueId: "` + item.node.content.id + `", title: "` + newTitleCard + `"}) {clientMutationId}`
                      mutations.push(mutation)
                      break;
                    case 'PULL_REQUEST':
                      mutation = `MyMutation` + item.node.content.id + `: updatePullRequest(input: {pullRequestId: "` + item.node.content.id + `", title: "` + newTitleCard + `"}) {clientMutationId}`
                      mutations.push(mutation)
                      break;
                  }
                }
              }
            }
          }
          if (mutations.length) {
            // console.log(mutations.join('\n'))
            const clientMutationId = await graphql(
                `mutation {` + mutations.join('\n') + `}`
                ,
                {
                  headers: {
                    authorization: `token ` + inputs.token,
                  },
                }
            );
            // console.log(clientMutationId)
          }
          hasNextPage = node.items.pageInfo.hasNextPage
          endCursor = `, after: "` + node.items.pageInfo.endCursor + `"`
        } while (hasNextPage)
      }
      console.log("Done")
    } else {
      console.log("Projects Not Found!")
    }
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}

run()
