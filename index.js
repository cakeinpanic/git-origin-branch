'use strict';
const {exec} = require('child_process');

function revParse(branchName) {
    return new Promise((resolve) => {
        exec(`git rev-parse origin/${branchName}`,
            (error) => {
                if (error) {
                    resolve({branchName, status: false});
                    return;
                }
                resolve({branchName, status: true});
            });
    });
}

function getAllBranchesList() {
    return new Promise((resolve) => {
        exec('git show-branch --topo-order',
            (error, output) => {
                resolve(getAllMatches(output))
            });
    })
}

function getAllPushedBranchesList() {
    return new Promise((resolve) => {
        exec('git show-branch -r ',
            (error, output) => {
                resolve(getAllMatches(output))
            });
    })
}

function getAllMatches(str) {
    let regex = /\[(.+)\]/;

    return str.split('\n')
              .map((line) => line.replace(/^.+\[/, '['))
              .map((line) => regex.exec(line) && regex.exec(line)[1])
              .filter(a => !!a)
              .map(branchName => branchName.replace(/([\^~](\d*))+/, ''))
              .map(branchName => branchName.replace('origin/', ''));
}

function getOriginBranch() {
    return Promise.all([getAllBranchesList(), getAllPushedBranchesList()])
                  .then(([allBranches, allPushedBranches]) => {
                      allBranches = allBranches
                          .filter(branchName => allPushedBranches.indexOf(branchName) > -1)
                          .filter((el, i, arr) => arr[i + 1] !== el);

                      return Promise
                          .all(allBranches.map((branchName) => revParse(branchName)))
                  })
                  .then(data => {
                      console.log(data);
                      return data.find((branch) => branch.status).branchName
                  })
                  .then(branchName => {
                      if (!branchName) {
                          throw Error('no origin at all, have never been pushed');
                      }
                      return `origin/${branchName.trim()}`
                  })
}


module.exports = getOriginBranch;
