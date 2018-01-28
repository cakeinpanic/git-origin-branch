const git = require('simple-git/promise')(process.cwd()).silent(true);
const {execSync} = require('child_process');

const getOriginBranch = require('../index');

let startBranch;

const ONE_STEP = 'oneStep';
const SECOND_STEP = 'secondStep';

let stashed = false;
// todo: amended commit
// todo: removed parent
function prepareBranches() {
    startBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    stash();
    checkoutBranch(ONE_STEP);
    checkoutBranch(SECOND_STEP);
}

function stash() {
    const filesChanged = execSync('git whatchanged -1 --format=oneline | wc -l').toString();

    if (filesChanged > 0) {
        execSync('git add .');
        execSync('git commit -am "temp"');
        stashed = true;
    }

}

function checkoutBranch(branchName) {
    execSync(`git checkout -b ${branchName}`);
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
           unstash();
       })
       .catch((err) => console.log(err))

}

function addAndCommitFile(name) {
    execSync(`touch ${name} && git add ${name} && git commit -am "test${name}"`);
}

describe('ff', () => {
    beforeAll(() => prepareBranches());

    afterAll((done) => clear().then(done));

    it('current level', (done) => {
        getOriginBranch()
           .then(data => console.log(data))
           .then(done);
    });

    it('first level', (done) => {
        git.checkout(ONE_STEP)
           .then(() => getOriginBranch())
           .then(data => console.log(data))
           .then(done);
    });

    it('second level', (done) => {
        git.checkout(SECOND_STEP)
           .then(() => getOriginBranch())
           .then(data => console.log(data))
           .then(done);
    });
});


