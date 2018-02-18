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
              .map(branchName => branchName.replace('origin/', ''))
              .filter((branchName, i, arr) => arr.indexOf(branchName) !== i);
}

function getOriginBranch() {
    return Promise.all([getAllBranchesList(), getAllPushedBranchesList()])
                  .then(([allBranches, allPushedBranches]) => {
                      allBranches = allBranches
                          .filter(branchName => allPushedBranches.indexOf(branchName) > -1)
                          .filter((el, i, arr) => arr[i + 1] !== el);
                      console.log(allBranches, allPushedBranches)
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


//
// function getAllBranchesList() {
//     return new Promise((resolve) => {
//         exec('git branch -a',
//             (error, output) => {
//                 resolve(getAllMatches(output));
//             });
//     })
// }
//
// function getAllMatches(str) {
//     const lines = str.split('\n');
//     let regex = /\*?\s+(.+)/;
//
//     const allBranches = lines.map((line) => line.replace(regex, '$1'))
//                              .filter(a => !!a);
//
//     const currentBranch = lines.find(line => line.includes('*')).replace(regex, '$1');
//
//     const remoteBranches = allBranches.filter(branchName => branchName.includes('remotes'))
//                                       .map(branchName => branchName.split('/')
//                                                                    .splice(2, 1)
//                                                                    .join('/'));
//
//     const localBranches = allBranches.filter(branchName => !branchName.includes('remotes'));
//
//     return {
//         currentBranch, remoteBranches, localBranches
//     }
//
// }
//
// function getOriginBranch() {
//     return getAllBranchesList()
//         .then((allBranches) => {
//             console.log(allBranches)
//             return Promise
//                 .all(allBranches.localBranches.map((branchName) => revParse(branchName)))
//         })
//         .then(data => {
//             console.log(data)
//             return data.find((branch) => branch.status).branchName
//         })
//         .then(branchName => {
//             if (!branchName) {
//                 throw Error('no origin at all, have never been pushed');
//             }
//             return `origin/${branchName.trim()}`
//         })
// }
//


module.exports = getOriginBranch;

getOriginBranch().then(t => console.log(t))
