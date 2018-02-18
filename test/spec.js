const git = require('simple-git/promise')(process.cwd()).silent(true);
const {execSync} = require('child_process');

const getOriginBranch = require('../index');

let startBranch;

const ONE_STEP = 'oneStep';
const SECOND_STEP = 'secondStep';
const THIRD_STEP = 'thirdStep';
const FOURTH_STEP = 'fourthStep';

let stashed = false;
// todo: amended commit
// todo: removed parent
function prepareBranches() {
    startBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    stash();
    checkoutNewBranch(ONE_STEP);
    checkoutNewBranch(SECOND_STEP);
    checkoutBranch(startBranch);
    checkoutNewBranch(THIRD_STEP);
    push(THIRD_STEP);
    checkoutNewBranch(FOURTH_STEP);
}

function stash() {
    const filesChanged = execSync('git whatchanged -1 --format=oneline | wc -l').toString();

    if (filesChanged > 0) {
        execSync('git add .');
        execSync('git commit -am "temp"');
        stashed = true;
    }

}

function push(branchName) {
    execSync(`git push --set-upstream origin ${branchName}`);
}

function deleteRemote(branchName) {
    execSync(`git push origin :${branchName}`);
}

function checkoutNewBranch(branchName) {
    execSync(`git checkout -b ${branchName}`);
}

function checkoutBranch(branchName) {
    execSync(`git checkout ${branchName}`);
}

function unstash() {
    if (stashed) {
        execSync('git reset HEAD^ --soft');
    }
    stashed = false;
}

function removeBranch(branchName) {
    execSync(`git branch ${branchName} -d`);
}

function clear() {
    git.checkout(startBranch)
       .then(() => {
           removeBranch(ONE_STEP);
           removeBranch(SECOND_STEP);
           removeBranch(THIRD_STEP);
           removeBranch(FOURTH_STEP);
           deleteRemote(THIRD_STEP);
           unstash();
       })
       .catch((err) => console.log(err))

}

function addAndCommitFile(name) {
    execSync(`touch ${name} && git add ${name} && git commit -am "test${name}"`);
}

fdescribe('ff', () => {
    beforeAll(() => prepareBranches());

    afterAll(() => clear());

    it('current level', (done) => {
        git.checkout(startBranch)
           .then(() => getOriginBranch())
           .then(data => {
               expect(data).toEqual('origin/master')
           })
           .then(done);
    });

    fit('first level', (done) => {
        git.checkout(ONE_STEP)
           .then(() => getOriginBranch())
           .then(data => {
               console.log(data)
               expect(data).toEqual('origin/master')
           })
           .then(done);
    });

    it('second level', (done) => {
        git.checkout(SECOND_STEP)
           .then(() => getOriginBranch())
           .then(data => {
               expect(data).toEqual('origin/master')
           })
           .then(done);
    });

    fdescribe('pushed', () => {

        it('pushed level', (done) => {
            git.checkout(THIRD_STEP)
               .then(() => getOriginBranch())
               .then(data => {
                   expect(data).toEqual(`origin/${THIRD_STEP}`)
               })
               .then(done);
        });

        it('second pushed level', (done) => {
            git.checkout(FOURTH_STEP)
               .then(() => getOriginBranch())
               .then(data => {
                   expect(data).toEqual(`origin/${THIRD_STEP}`)
               })
               .then(done);
        });
    });
});


