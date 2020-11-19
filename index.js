const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function getFileList(filePath) {
    let stat = fs.statSync(filePath);
    let isDirectory = stat.isDirectory();
    let fileList = [];
    if (isDirectory) {
        let readdir = fs.readdirSync(filePath);
        readdir.forEach(item => {
            fileList =  fileList.concat(getFileList(path.join(filePath, item)));
        });
    } else {
        fileList.push(filePath);
    }
    return fileList;
}

function execGit(cb) {
    exec('git status -s', (err, stdout, stderr) => {
        if (err || stderr) {
            console.error(err || stderr);
            return;
        }
        let statusList = stdout.split('\n').filter(item => !!item).map(item => {
            const status = item.substr(0, 2);
            let filePath = item.substr(3);

            filePath = status.includes('R') ? filePath.substr(filePath.indexOf('-> ') + 3) : filePath;
            filePath = path.join(__dirname, filePath);
            return {
                item: item,
                status: status,
                indexStatus: item.substr(0, 1),
                workStatus: item.substr(1, 1),
                file: getFileList(filePath)
            }
        });

        const indexList = statusList.filter(item => {
            const indexStatus = item.indexStatus.trim();
            return indexStatus && indexStatus !== '?';
        });

        const workList = statusList.filter(item => {
            const workStatus = item.workStatus.trim();
            return workStatus && workStatus !== '?';
        });

        const addList = statusList.filter(item => {
            return item.status === '??';
        });

        const result = {
            indexList,
            workList,
            addList,
            statusList
        };
        cb && cb(result);
    });
}

function getFileStatus() {
    return new Promise((resolve, reject) => {
        try {
            execGit(resolve);
        } catch (e) {
            console.error(e);
            reject(e);
        }
    });
}

// execGit(console.log);

module.exports = {
    getFileList,
    getFileStatus,
    execGit
};