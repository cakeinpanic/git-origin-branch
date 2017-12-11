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
        exec('git show-branch -a --topo-order | grep \'\\*\' ',
            (error, output) => {
                resolve(output)
            });
    })
}

function getAllMatches(str, regex) {
    let matches = [];
    let m;
    while (m = regex.exec(str)) {
        matches.push(m[1]);
    }
    return matches;
}

function getOriginBranch() {
    return getAllBranchesList()
        .then(output => {
            let allBranches = getAllMatches(output, /\[(.+)\]/g).splice(1);
            return Promise
                .all(
                    allBranches
                        .reverse()
                        .map((branchName) => revParse(branchName))
                )


        })
        .then(data => {
            return data.find((branch) => branch.status).branchName;
        })
        .then(branchName => {
            if (!branchName) {
                throw Error('no origin at all, have never been pushed');
            }
            return `origin/${branchName.trim()}`
        })
}


module.exports = getOriginBranch;

getOriginBranch().then((data) => console.log(data))