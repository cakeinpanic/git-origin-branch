'use strict';
const {exec} = require('child_process');
const git = require('simple-git/promise')(process.cwd()).silent(true);

// snippet found here https://gist.github.com/joechrysler/6073741
function getOriginBranch(currentBranchName) {
    return git.revparse(['--abbrev-ref', 'HEAD'])
              .then((branchName) => {
                  branchName = currentBranchName || branchName;
                  console.log(branchName)

                  return git.revparse([`origin/${branchName.trim()}`])
                            .then(() => branchName)
              })
              .catch(() => {
                  console.log('catch')
                  let b = currentBranchName || "git rev-parse --abbrev-ref HEAD"
                  // https://gist.github.com/joechrysler/6073741
                  return new Promise((resolve) => {
                      exec("git show-branch -a \\\n" +
                          "| grep '\\*' \\\n" +
                          "| grep -v `" + b + "` \\\n" +
                          "| head -n1 \\\n" +
                          "| sed 's/.*\\[\\(.*\\)\\].*/\\1/' \\\n" +
                          "| sed 's/[\\^~].*//'",
                          (error, branchName) => {
                              resolve(branchName);
                          });
                  })
              })
              .then(branchName => {
                  if (!branchName) {
                      throw Error('no origin at all, have never been pushed');
                  }
                  return `origin/${branchName.trim()}`
              })
}


module.exports = getOriginBranch;

getOriginBranch().then((data)=>console.log(data))